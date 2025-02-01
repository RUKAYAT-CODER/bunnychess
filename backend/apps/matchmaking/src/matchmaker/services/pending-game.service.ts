import { GameType } from '@common/game/model/game-type';
import {
  GAME_PACKAGE_NAME,
  GAME_SERVICE_NAME,
  GameServiceClient,
} from '@common/game/proto/game.pb';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { RankingMetadata } from '../../ranking/model/ranking-metadata.interface';
import { RankingService } from '../../ranking/services/ranking.service';
import { PENDING_GAME_QUEUE, PendingGameJob } from '../job/pending-game.queue';
import { PlayerStatus } from '../model/player-status.enum';
import { PendingGameRepositoryService } from '../repositories/pending-game.repository.service';
import { PlayerStatusService } from './player-status.service';
import { StreamService } from './stream.service';

export interface CreatePendingGame {
  accountId0: string;
  accountId1: string;
  gameType: GameType;
  ranked: boolean;
}

export interface AcceptPendingGame {
  accountId: string;
  pendingGameId: string;
}

export interface CancelPendingGame {
  pendingGameId: string;
  accountId0: string;
  accountId1: string;
}

@Injectable()
export class PendingGameService implements OnModuleInit {
  private readonly logger = new Logger(PendingGameService.name);
  private grpcGameService: GameServiceClient;

  private readonly PENDING_GAME_TIMEOUT_SECONDS = 5;

  constructor(
    @InjectQueue(PENDING_GAME_QUEUE) private pendingGameQueue: Queue,
    @Inject(GAME_PACKAGE_NAME) private readonly gameClient: ClientGrpc,
    private readonly pendingGameRepository: PendingGameRepositoryService,
    private readonly playerStatusService: PlayerStatusService,
    private readonly streamService: StreamService,
    private readonly rankingService: RankingService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.grpcGameService = this.gameClient.getService<GameServiceClient>(GAME_SERVICE_NAME);
  }

  /**
   * Create new pending game between two players.
   * Player will be able to accept the pending game request and a new game will be created
   * when both players accept.
   *
   * @param param account ids and game type data (game type + ranked or not)
   * @returns newly created pending game id
   */
  async createPendingGame({
    accountId0,
    accountId1,
    gameType,
    ranked,
  }: CreatePendingGame): Promise<string> {
    const pendingGameId = randomUUID();
    await this.pendingGameRepository.createPendingGame({
      accountId0,
      accountId1,
      pendingGameId,
      gameType,
      ranked,
      timeoutSeconds: this.PENDING_GAME_TIMEOUT_SECONDS,
    });
    await this.streamService.emitPendingGameReady({ accountId0, accountId1, pendingGameId });
    await this.pendingGameQueue.add(
      PendingGameJob.Timeout,
      { pendingGameId, accountId0, accountId1 },
      {
        jobId: pendingGameId,
        delay: this.PENDING_GAME_TIMEOUT_SECONDS * 1000,
      },
    );
    this.logger.debug(
      `Pending game ${pendingGameId} (${gameType}, ${
        ranked ? 'ranked' : 'normal'
      }) for accounts ${accountId0} and ${accountId1}, timeout in ${
        this.PENDING_GAME_TIMEOUT_SECONDS
      } seconds`,
    );
    return pendingGameId;
  }

  /**
   * Accept pending game on behalf of a player and create new game when both players accepted.
   *
   * @param param accepting player and pending game id
   * @returns number of players that accepted the game so far
   */
  async acceptPendingGame({ accountId, pendingGameId }: AcceptPendingGame): Promise<number> {
    const { readyPlayersCount, gameType, accountIds, ranked } =
      await this.pendingGameRepository.acceptPendingGame({ accountId, pendingGameId });
    this.logger.debug(`Pending game ${pendingGameId} accepted by ${accountId}`);
    if (readyPlayersCount !== 2) {
      // Only one player accepted the game so far
      return readyPlayersCount;
    }

    // Both players accepted the game: create the game and remove pending game
    const mmrType = ranked ? 'rankedMmr' : 'normalMmr';
    const [ranking0, ranking1] = await Promise.all(
      accountIds.map((accountId) => this.rankingService.getRankingOrDefault(accountId)),
    );

    // Store ranking-related metadata (mmr + ranked flag) in game metadata: it will be re-emitted via GameOver
    // event by Game service when game ends, so that ranking service can update players' ratings using
    // the mmr values players had at the start of the game.
    // Not doing so would require to fetch the ranking values from the database, which could cause
    // wrong ratings calculations if GameOver NATS messages are processed out of order and will also require some
    // SELECT FOR UPDATE statements (=locks).
    // Not wanting to reduce NATS consumers parallelism (another theoretical solution), this is a good trade-off.
    // An alternative would be to temporarily store ranking metadata in Redis.
    const metadata: RankingMetadata = {
      mmr: {
        [accountIds[0]]: ranking0[mmrType],
        [accountIds[1]]: ranking1[mmrType],
      },
      ranked,
    };

    const { gameId } = await firstValueFrom(
      this.grpcGameService.createGame({
        accountId0: accountIds[0],
        accountId1: accountIds[1],
        gameType,
        metadata: JSON.stringify(metadata),
      }),
    );
    await this.playerStatusService.setPlayerStatuses(
      accountIds.map((accountId) => ({
        accountId,
        newStatus: { gameId, gameType, ranked, status: PlayerStatus.Playing },
      })),
    );
    await this.pendingGameQueue.remove(pendingGameId);
    return readyPlayersCount;
  }

  /**
   * Cancel pending game and reset players' statuses.
   *
   * @param param pending game id and related account ids
   * @returns whether the pending game was deleted or not
   */
  async cancelPendingGame({
    pendingGameId,
    accountId0,
    accountId1,
  }: CancelPendingGame): Promise<boolean> {
    const deleted = await this.pendingGameRepository.cancelPendingGame({
      pendingGameId,
      accountId0,
      accountId1,
    });
    await this.pendingGameQueue.remove(pendingGameId);
    await this.streamService.emitPendingGameTimeout({
      accountId0,
      accountId1,
      pendingGameId,
    });
    return deleted;
  }
}
