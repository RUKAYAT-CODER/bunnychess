import { GameType } from '@common/game/model/game-type';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Redis } from 'ioredis';
import { join } from 'path';
import { PendingGameNotFoundException } from '../exceptions/pending-game-not-found.exception';
import { PendingGame } from '../model/pending-game.interface';
import { PlayerStatus } from '../model/player-status.enum';
import { PlayerStatusRepositoryService } from './player-status.repository.service';

interface CreatePendingGame {
  accountId0: string;
  accountId1: string;
  pendingGameId: string;
  gameType: GameType;
  ranked: boolean;
  timeoutSeconds: number;
}

interface AcceptPendingGame {
  accountId: string;
  pendingGameId: string;
}

interface CancelPendingGame {
  pendingGameId: string;
  accountId0: string;
  accountId1: string;
}

interface SerializedPendingGame {
  readyPlayersCount: number;
  gameType: GameType;
  ranked: boolean;
  accountIds: string[];
  [accountId: string]: any;
}

interface PendingGameRedis extends Redis {
  acceptPendingGame: (pendingGameKey: string, accountId: string) => Promise<string | null>;
  cancelPendingGame: (
    pendingGameKey: string,
    accountId0StatusKey: string,
    accountId1StatusKey: string,
    pendingGameId: string,
  ) => Promise<number>;
}

// Not really a repository but rather a way to create a layer between services and Redis, with some data transformation on top of it.
@Injectable()
export class PendingGameRepositoryService {
  constructor(
    @((InjectRedis as any)()) private readonly redis: PendingGameRedis,
    private readonly playerStatusRepository: PlayerStatusRepositoryService,
  ) {
    this.redis.defineCommand('acceptPendingGame', {
      lua: readFileSync(join(__dirname, 'matchmaker/lua-scripts/accept-pending-game.lua'), 'utf-8'),
      numberOfKeys: 1,
    });

    this.redis.defineCommand('cancelPendingGame', {
      lua: readFileSync(join(__dirname, 'matchmaker/lua-scripts/cancel-pending-game.lua'), 'utf-8'),
      numberOfKeys: 3,
    });
  }

  async createPendingGame({
    accountId0,
    accountId1,
    pendingGameId,
    gameType,
    ranked,
    timeoutSeconds,
  }: CreatePendingGame): Promise<void> {
    const pendingGameKey = this.getPendingGameKey(pendingGameId);
    const transaction = this.redis.multi();
    transaction.set(
      pendingGameKey,
      JSON.stringify({
        [accountId0]: 0,
        [accountId1]: 0,
        accountIds: [accountId0, accountId1],
        gameType,
        ranked,
      }),
      'EX',
      timeoutSeconds,
    );
    await this.playerStatusRepository.setPlayerStatuses(
      [accountId0, accountId1].map((accountId) => ({
        accountId,
        newStatus: {
          gameId: pendingGameId,
          gameType,
          ranked,
          status: PlayerStatus.Pending,
        },
        expireInSeconds: timeoutSeconds,
      })),
      transaction,
    );
  }

  async acceptPendingGame({ accountId, pendingGameId }: AcceptPendingGame): Promise<PendingGame> {
    const jsonString = await this.redis.acceptPendingGame(
      this.getPendingGameKey(pendingGameId),
      accountId,
    );
    if (!jsonString) {
      throw new PendingGameNotFoundException();
    }

    const json = JSON.parse(jsonString) as SerializedPendingGame;
    return {
      readyPlayersCount: json[json.accountIds[0]] + json[json.accountIds[1]],
      gameType: json.gameType,
      ranked: json.ranked,
      accountIds: json.accountIds,
    };
  }

  async cancelPendingGame({
    pendingGameId,
    accountId0,
    accountId1,
  }: CancelPendingGame): Promise<boolean> {
    return Boolean(
      await this.redis.cancelPendingGame(
        this.getPendingGameKey(pendingGameId),
        this.playerStatusRepository.getAccountStatusKey(accountId0),
        this.playerStatusRepository.getAccountStatusKey(accountId1),
        pendingGameId,
      ),
    );
  }

  private getPendingGameKey(pendingGameId: string): string {
    return `matchmaking:pending-game:${pendingGameId}:status`;
  }
}
