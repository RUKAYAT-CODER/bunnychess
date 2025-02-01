import { GameType } from '@common/game/model/game-type';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ChainableCommander, Redis } from 'ioredis';
import { isEmpty } from 'lodash';
import { join } from 'path';
import { MatchmakingStatus } from '../model/matchmaking-status.interface';
import { PlayerStatus } from '../model/player-status.enum';

interface StatusUpdate {
  accountId: string;
  newStatus: Partial<MatchmakingStatus>;
  expireInSeconds?: number;
}

interface PlayerStatusRedis extends Redis {
  deletePlayingPlayerStatuses: (
    accountId0StatusKey: string,
    accountId1StatusKey: string,
    gameId: string,
  ) => Promise<number>;
}

@Injectable()
export class PlayerStatusRepositoryService {
  constructor(@((InjectRedis as any)()) private readonly redis: PlayerStatusRedis) {
    this.redis.defineCommand('deletePlayingPlayerStatuses', {
      lua: readFileSync(
        join(__dirname, 'matchmaker/lua-scripts/delete-playing-player-statuses.lua'),
        'utf-8',
      ),
      numberOfKeys: 2,
    });
  }

  async getPlayerStatus(accountId: string): Promise<MatchmakingStatus> {
    const result = await this.redis.hgetall(this.getAccountStatusKey(accountId));
    return isEmpty(result)
      ? { status: PlayerStatus.Undefined }
      : {
          status: result.status as PlayerStatus,
          gameType: result.gameType as GameType,
          ranked: result.ranked === 'true',
          gameId: result.gameId,
        };
  }

  async setPlayerStatuses(statusUpdates: StatusUpdate[], trx?: ChainableCommander): Promise<void> {
    const transaction = trx ?? this.redis.multi();
    for (const { accountId, newStatus, expireInSeconds } of statusUpdates) {
      const accountStatusKey = this.getAccountStatusKey(accountId);
      transaction.hset(accountStatusKey, {
        ...newStatus,
        ranked: newStatus.ranked != null ? newStatus.ranked.toString() : undefined,
      });
      transaction.expire(accountStatusKey, expireInSeconds ?? 86400); // default: 1 day
    }
    await transaction.exec();
  }

  async deletePlayerStatuses(accountIds: string[]): Promise<number> {
    return this.redis.del(accountIds.map((accountId) => this.getAccountStatusKey(accountId)));
  }

  async deletePlayingPlayerStatuses({
    accountId0,
    accountId1,
    gameId,
  }: {
    accountId0: string;
    accountId1: string;
    gameId: string;
  }): Promise<number> {
    return this.redis.deletePlayingPlayerStatuses(
      this.getAccountStatusKey(accountId0),
      this.getAccountStatusKey(accountId1),
      gameId,
    );
  }

  getAccountStatusKey(accountId: string): string {
    return `matchmaking:account:${accountId}:status`;
  }
}
