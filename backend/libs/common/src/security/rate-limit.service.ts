import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    keyGenerator?: (identifier: string) => string; // Custom key generator
}

@Injectable()
export class RateLimitService {
    private readonly logger = new Logger(RateLimitService.name);

    constructor(@InjectRedis() private readonly redis: Redis) { }

    /**
     * Check if a request is allowed based on rate limiting
     */
    async isAllowed(identifier: string, config: RateLimitConfig): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }> {
        const key = this.generateKey(identifier, config);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        try {
            // Get current requests in the window
            const requests = await this.redis.zrangebyscore(key, windowStart, '+inf');
            const currentCount = requests.length;

            if (currentCount >= config.maxRequests) {
                // Rate limit exceeded
                const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
                const resetTime = oldestRequest.length > 0 ? parseInt(oldestRequest[0].split(':')[1]) + config.windowMs : now + config.windowMs;

                return {
                    allowed: false,
                    remaining: 0,
                    resetTime,
                };
            }

            // Add current request to the sorted set
            await this.redis.zadd(key, now, `${now}-${Math.random()}`);

            // Set expiration for the key
            await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

            return {
                allowed: true,
                remaining: config.maxRequests - currentCount - 1,
                resetTime: now + config.windowMs,
            };
        } catch (error) {
            this.logger.error('Error checking rate limit', error);
            // In case of Redis error, allow the request
            return {
                allowed: true,
                remaining: config.maxRequests,
                resetTime: now + config.windowMs,
            };
        }
    }

    /**
     * Get rate limit information for an identifier
     */
    async getRateLimitInfo(identifier: string, config: RateLimitConfig): Promise<{
        current: number;
        remaining: number;
        resetTime: number;
        limit: number;
    }> {
        const key = this.generateKey(identifier, config);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        try {
            const requests = await this.redis.zrangebyscore(key, windowStart, '+inf');
            const currentCount = requests.length;
            const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
            const resetTime = oldestRequest.length > 0 ? parseInt(oldestRequest[0].split(':')[1]) + config.windowMs : now + config.windowMs;

            return {
                current: currentCount,
                remaining: Math.max(0, config.maxRequests - currentCount),
                resetTime,
                limit: config.maxRequests,
            };
        } catch (error) {
            this.logger.error('Error getting rate limit info', error);
            return {
                current: 0,
                remaining: config.maxRequests,
                resetTime: now + config.windowMs,
                limit: config.maxRequests,
            };
        }
    }

    /**
     * Reset rate limit for an identifier
     */
    async resetRateLimit(identifier: string, config: RateLimitConfig): Promise<void> {
        const key = this.generateKey(identifier, config);

        try {
            await this.redis.del(key);
            this.logger.debug(`Reset rate limit for identifier: ${identifier}`);
        } catch (error) {
            this.logger.error('Error resetting rate limit', error);
        }
    }

    /**
     * Generate a Redis key for rate limiting
     */
    private generateKey(identifier: string, config: RateLimitConfig): string {
        const keyGenerator = config.keyGenerator || ((id: string) => `rate_limit:${id}`);
        return keyGenerator(identifier);
    }

    /**
     * Get rate limit statistics
     */
    async getStats(): Promise<{
        totalKeys: number;
        totalRequests: number;
    }> {
        try {
            const keys = await this.redis.keys('rate_limit:*');
            let totalRequests = 0;

            for (const key of keys) {
                const count = await this.redis.zcard(key);
                totalRequests += count;
            }

            return {
                totalKeys: keys.length,
                totalRequests,
            };
        } catch (error) {
            this.logger.error('Error getting rate limit stats', error);
            return {
                totalKeys: 0,
                totalRequests: 0,
            };
        }
    }
} 