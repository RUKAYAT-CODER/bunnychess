import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: async () => ({
                store: await redisStore({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                    ttl: 60 * 60 * 24, // 24 hours default TTL
                }),
                ttl: 60 * 60 * 24, // 24 hours
                max: 1000, // maximum number of items in cache
            }),
        }),
    ],
    providers: [CacheService],
    exports: [CacheService, CacheModule],
})
export class AppCacheModule { } 