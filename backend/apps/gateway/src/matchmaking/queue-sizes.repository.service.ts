import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Redis } from 'ioredis';
import { join } from 'path';

interface QueueSizes {
  [key: string]: { normal: number; ranked: number };
}

interface GatewayRedis extends Redis {
  updateQueueSizes: (queueSizesKey: string, queueSizesValue: string) => Promise<string | null>;
}

@Injectable()
export class QueueSizesRepositoryService {
  constructor(@((InjectRedis as any)()) private readonly redis: GatewayRedis) {
    this.redis.defineCommand('updateQueueSizes', {
      lua: readFileSync(join(__dirname, 'matchmaking/lua-scripts/update-queue-sizes.lua'), 'utf-8'),
      numberOfKeys: 1,
    });
  }

  async getQueueSizes(): Promise<QueueSizes | undefined> {
    const cachedQueueSizes = await this.redis.get(this.getQueueSizesKey());
    return cachedQueueSizes ? JSON.parse(cachedQueueSizes) : undefined;
  }

  /**
   * Return true if new value is different from the previously cached one, false otherwise.
   */
  async updateQueueSizes(queueSizes: QueueSizes): Promise<boolean> {
    const newValue = await this.redis.updateQueueSizes(
      this.getQueueSizesKey(),
      JSON.stringify(queueSizes),
    );
    return newValue !== null;
  }

  private getQueueSizesKey(): string {
    return 'gateway:queue-sizes';
  }
}
