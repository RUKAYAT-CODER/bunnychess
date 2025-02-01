import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class JwtRepositoryService {
  constructor(@((InjectRedis as any)()) private readonly redis: Redis) {}

  async storeJwtRefresh(accountId: string, jti: string, expireInSeconds: number): Promise<void> {
    await this.redis
      .multi()
      .sadd(this.getRefreshTokensKey(accountId), jti)
      .expire(this.getRefreshTokensKey(accountId), expireInSeconds)
      .exec();
  }

  async deleteJwtRefresh(accountId: string, jti: string): Promise<boolean> {
    return Boolean(await this.redis.srem(this.getRefreshTokensKey(accountId), jti));
  }

  private getRefreshTokensKey(accountId: string): string {
    return `account:${accountId}:jwt-refresh-tokens`;
  }
}
