import { GameType } from '@common/game/model/game-type';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Redis } from 'ioredis';
import { chunk } from 'lodash';
import { join } from 'path';
import { PlayerStatusException } from '../exceptions/player-status.exception';
import { UnexpectedAccountStatusesException } from '../exceptions/unexpected-account-statuses.exception';
import { PlayerStatus } from '../model/player-status.enum';
import { QueueConfig } from '../model/queue-config.interface';
import { PlayerStatusRepositoryService } from './player-status.repository.service';

interface MatchmakingQueueRedis extends Redis {
  matchPlayers: (
    queueKey: string,
    timesKey: string,
    baseMmrRange: number,
    mmrIncreasePerSecond: number,
    maxMmrDelta: number,
  ) => Promise<string[]>;
  removeMatchedPlayersFromQueue: (
    queueKey: string,
    timesKey: string,
    accountId0StatusKey: string,
    accountId1StatusKey: string,
    accountId0: string,
    accountId1: string,
  ) => Promise<number>;
  addPlayerToQueue: (
    queueKey: string,
    timesKey: string,
    accountStatusKey: string,
    newStatus: PlayerStatus,
    accountId: string,
    mmr: number,
    gameType: GameType,
    ranked: BooleanString,
  ) => Promise<PlayerStatus | null>;
  removePlayerFromQueue: (
    queueKey: string,
    timesKey: string,
    accountStatusKey: string,
    accountId: string,
    gameType: GameType,
    ranked: BooleanString,
  ) => Promise<number>;
}

type BooleanString = 'true' | 'false';

interface QueueKeys {
  queueKey: string;
  timesKey: string;
}

interface AddToQueue {
  accountId: string;
  mmr: number;
  gameType: GameType;
  ranked: boolean;
}

interface RemoveFromQueue {
  accountId: string;
  gameType: GameType;
  ranked: boolean;
}

interface RemoveMatchedFromQueue {
  accountId0: string;
  accountId1: string;
  gameType: GameType;
  ranked: boolean;
}

interface QueueType {
  gameType: GameType;
  ranked: boolean;
}

interface QueueSizes {
  [key: string]: {
    normal: number;
    ranked: number;
  };
}

// Not really a repository but rather a way to create a layer between services and Redis, with some data transformation on top of it.
@Injectable()
export class MatchmakingQueueRepositoryService {
  constructor(
    @((InjectRedis as any)()) private readonly redis: MatchmakingQueueRedis,
    private readonly playerStatusRepository: PlayerStatusRepositoryService,
  ) {
    this.redis.defineCommand('matchPlayers', {
      lua: readFileSync(join(__dirname, 'matchmaker/lua-scripts/match-players.lua'), 'utf-8'),
      numberOfKeys: 2,
    });

    this.redis.defineCommand('removeMatchedPlayersFromQueue', {
      lua: readFileSync(
        join(__dirname, 'matchmaker/lua-scripts/remove-matched-players-from-queue.lua'),
        'utf-8',
      ),
      numberOfKeys: 4,
    });

    this.redis.defineCommand('addPlayerToQueue', {
      lua: readFileSync(join(__dirname, 'matchmaker/lua-scripts/add-player-to-queue.lua'), 'utf-8'),
      numberOfKeys: 3,
    });

    this.redis.defineCommand('removePlayerFromQueue', {
      lua: readFileSync(
        join(__dirname, 'matchmaker/lua-scripts/remove-player-from-queue.lua'),
        'utf-8',
      ),
      numberOfKeys: 3,
    });
  }

  async addPlayerToQueue({ accountId, mmr, gameType, ranked }: AddToQueue): Promise<void> {
    const { queueKey, timesKey } = this.getQueueKeys(gameType, ranked);

    const statusError = await this.redis.addPlayerToQueue(
      queueKey,
      timesKey,
      this.playerStatusRepository.getAccountStatusKey(accountId),
      PlayerStatus.Searching,
      accountId,
      mmr,
      gameType,
      ranked.toString() as BooleanString,
    );

    if (statusError) {
      throw new PlayerStatusException();
    }
  }

  async removePlayerFromQueue({ accountId, gameType, ranked }: RemoveFromQueue): Promise<void> {
    const { queueKey, timesKey } = this.getQueueKeys(gameType, ranked);

    const deleted = Boolean(
      await this.redis.removePlayerFromQueue(
        queueKey,
        timesKey,
        this.playerStatusRepository.getAccountStatusKey(accountId),
        accountId,
        gameType,
        ranked.toString() as BooleanString,
      ),
    );

    if (!deleted) {
      throw new PlayerStatusException();
    }
  }

  async matchPlayersInQueue(
    gameType: GameType,
    ranked: boolean,
    queueConfig: QueueConfig,
  ): Promise<[string, string][]> {
    const { queueKey, timesKey } = this.getQueueKeys(gameType, ranked);

    const matchedPlayers = await this.redis.matchPlayers(
      queueKey,
      timesKey,
      queueConfig.baseMmrRange,
      queueConfig.mmrRangeIncreasePerSecond,
      queueConfig.maxMmrDelta,
    );

    return chunk(matchedPlayers, 2) as [string, string][];
  }

  async removeMatchedPlayersFromQueue({
    accountId0,
    accountId1,
    gameType,
    ranked,
  }: RemoveMatchedFromQueue): Promise<void> {
    const { queueKey, timesKey } = this.getQueueKeys(gameType, ranked);

    const removedAccounts = await this.redis.removeMatchedPlayersFromQueue(
      queueKey,
      timesKey,
      this.playerStatusRepository.getAccountStatusKey(accountId0),
      this.playerStatusRepository.getAccountStatusKey(accountId1),
      accountId0,
      accountId1,
    );

    if (removedAccounts !== 2) {
      throw new UnexpectedAccountStatusesException(
        `Unexpected account statuses while removing matched players ${accountId0} and ${accountId1} from ${
          ranked ? 'ranked' : 'normal'
        } ${gameType} queue`,
      );
    }
  }

  async getQueueSizes(queues: QueueType[]): Promise<QueueSizes> {
    const queueKeys = queues.map(
      ({ gameType, ranked }) => this.getQueueKeys(gameType, ranked).queueKey,
    );

    const pipeline = this.redis.multi();
    queueKeys.forEach((queueKey) => pipeline.zcard(queueKey));
    const result = await pipeline.exec();

    return queues.reduce((acc: QueueSizes, { gameType, ranked }, index) => {
      if (!acc[gameType]) {
        acc[gameType] = { ranked: 0, normal: 0 };
      }
      acc[gameType][ranked ? 'ranked' : 'normal'] = Number(result![index][1]);
      return acc;
    }, {});
  }

  private getQueueKeys(gameType: GameType, ranked: boolean): QueueKeys {
    return {
      queueKey: `matchmaking:queue:${gameType}:${ranked ? 'ranked' : 'normal'}`,
      timesKey: `matchmaking:queue:${gameType}:${ranked ? 'ranked' : 'normal'}:times`,
    };
  }
}
