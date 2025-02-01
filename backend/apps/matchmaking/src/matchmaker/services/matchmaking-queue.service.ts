import { GameType } from '@common/game/model/game-type';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RankingService } from '../../ranking/services/ranking.service';
import { MATCH_PLAYERS_QUEUE, MatchPlayersJob } from '../job/match-players.queue';
import { PlayerStatus } from '../model/player-status.enum';
import { QueueConfig } from '../model/queue-config.interface';
import { MatchmakingQueueRepositoryService } from '../repositories/matchmaking-queue.repository.service';
import { PlayerStatusService } from './player-status.service';

export interface AddToQueue {
  accountId: string;
  gameType: GameType;
  ranked: boolean;
}

export interface QueueSizes {
  [key: string]: {
    normal: number;
    ranked: number;
  };
}

export interface RemoveMatchedPlayersFromQueue {
  accountId0: string;
  accountId1: string;
  gameType: GameType;
  ranked: boolean;
}

@Injectable()
export class MatchmakingQueueService implements OnModuleInit {
  private readonly logger = new Logger(MatchmakingQueueService.name);

  private readonly RANKED_CONFIG: QueueConfig = {
    baseMmrRange: 50,
    mmrRangeIncreasePerSecond: 5,
    maxMmrDelta: 400,
  };
  private readonly NORMAL_CONFIG: QueueConfig = {
    baseMmrRange: 100,
    mmrRangeIncreasePerSecond: 10,
    maxMmrDelta: 600,
  };
  private readonly RANKED_QUEUE_CHECK_INTERVAL_MS: number = 2000;
  private readonly NORMAL_QUEUE_CHECK_INTERVAL_MS: number = 1500;

  constructor(
    @InjectQueue(MATCH_PLAYERS_QUEUE) private matchPlayersQueue: Queue,
    private readonly matchmakingQueueRepository: MatchmakingQueueRepositoryService,
    private readonly playerStatusService: PlayerStatusService,
    private readonly rankingService: RankingService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initQueues();
  }

  /**
   * Add player to matchmaking queue.
   *
   * @param param account id to add and additional details to determine the right queue to put the player in
   */
  async addPlayerToQueue({ accountId, gameType, ranked }: AddToQueue): Promise<void> {
    const ranking = await this.rankingService.getOrCreateRanking(accountId);
    await this.matchmakingQueueRepository.addPlayerToQueue({
      accountId,
      mmr: ranked ? ranking.rankedMmr : ranking.normalMmr,
      gameType,
      ranked,
    });
    this.logger.debug(
      `Player ${accountId} added to ${ranked ? 'ranked' : 'normal'} ${gameType} queue`,
    );
  }

  /**
   * Remove player from any matchmaking queue.
   *
   * @param param account id to remove from any queue
   */
  async removePlayerFromQueue({ accountId }: { accountId: string }): Promise<void> {
    const { status, gameType, ranked } = await this.playerStatusService.getPlayerStatus(accountId);
    if (!(status === PlayerStatus.Searching && gameType && ranked != null)) {
      return;
    }
    await this.matchmakingQueueRepository.removePlayerFromQueue({
      accountId,
      gameType,
      ranked,
    });
    this.logger.debug(
      `Player ${accountId} removed from ${ranked ? 'ranked' : 'normal'} ${gameType} queue`,
    );
  }

  /**
   * Trigger players matching process in specified queue, returning a list of paired players that
   * pass matching criteria (similar ranking, time spent in the queue, etc.).
   *
   * @param param which queue to match players from
   * @returns pairs of matched player ids
   */
  async matchPlayersInQueue({
    gameType,
    ranked,
  }: {
    gameType: GameType;
    ranked: boolean;
  }): Promise<[string, string][]> {
    const matchedPlayers = await this.matchmakingQueueRepository.matchPlayersInQueue(
      gameType,
      ranked,
      ranked ? this.RANKED_CONFIG : this.NORMAL_CONFIG,
    );
    return matchedPlayers;
  }

  /**
   * Remove two players from specified queue.
   *
   * @param param player ids to remove from queue and data to identify the queue
   */
  async removeMatchedPlayersFromQueue(param: RemoveMatchedPlayersFromQueue): Promise<void> {
    return this.matchmakingQueueRepository.removeMatchedPlayersFromQueue(param);
  }

  /**
   * Get current number of players inside every queue.
   *
   * @returns mapping between queue identifier and number of players in it
   */
  async getQueueSizes(): Promise<QueueSizes> {
    return this.matchmakingQueueRepository.getQueueSizes(
      Object.values(GameType).flatMap((gameType) =>
        [true, false].map((ranked) => ({ gameType, ranked })),
      ),
    );
  }

  private async initQueues(): Promise<void> {
    const repeatable = await this.matchPlayersQueue.getRepeatableJobs();
    await Promise.all(
      repeatable.map((job) => this.matchPlayersQueue.removeRepeatableByKey(job.key)),
    );
    Object.values(GameType).forEach((gameType) =>
      [true, false].forEach(async (ranked) => {
        await this.matchPlayersQueue.add(
          MatchPlayersJob.CheckQueue,
          { gameType, ranked },
          {
            jobId: `job_${gameType}_${ranked ? 'ranked' : 'normal'}`,
            repeat: {
              every: ranked
                ? this.RANKED_QUEUE_CHECK_INTERVAL_MS
                : this.NORMAL_QUEUE_CHECK_INTERVAL_MS,
            },
          },
        );
      }),
    );
  }
}
