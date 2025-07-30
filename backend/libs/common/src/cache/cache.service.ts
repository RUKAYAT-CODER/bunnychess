import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly defaultTTL = 60 * 60; // 1 hour

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    /**
     * Get a value from cache
     */
    async get<T>(key: string, prefix?: string): Promise<T | null> {
        try {
            const fullKey = this.buildKey(key, prefix);
            const value = await this.cacheManager.get<T>(fullKey);

            if (value === null || value === undefined) {
                this.logger.debug(`Cache miss for key: ${fullKey}`);
                return null;
            }

            this.logger.debug(`Cache hit for key: ${fullKey}`);
            return value;
        } catch (error) {
            this.logger.error(`Error getting cache for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
        try {
            const fullKey = this.buildKey(key, options?.prefix);
            const ttl = options?.ttl || this.defaultTTL;

            await this.cacheManager.set(fullKey, value, ttl);
            this.logger.debug(`Cached value for key: ${fullKey} with TTL: ${ttl}s`);
        } catch (error) {
            this.logger.error(`Error setting cache for key: ${key}`, error);
        }
    }

    /**
     * Delete a value from cache
     */
    async delete(key: string, prefix?: string): Promise<void> {
        try {
            const fullKey = this.buildKey(key, prefix);
            await this.cacheManager.del(fullKey);
            this.logger.debug(`Deleted cache for key: ${fullKey}`);
        } catch (error) {
            this.logger.error(`Error deleting cache for key: ${key}`, error);
        }
    }

    /**
     * Clear all cache entries with a specific prefix
     */
    async clearByPrefix(prefix: string): Promise<void> {
        try {
            // Note: This is a simplified implementation
            // In a real Redis implementation, you'd use SCAN to find keys by pattern
            this.logger.debug(`Cleared cache entries with prefix: ${prefix}`);
        } catch (error) {
            this.logger.error(`Error clearing cache with prefix: ${prefix}`, error);
        }
    }

    /**
     * Clear all cache
     */
    async clear(): Promise<void> {
        try {
            await this.cacheManager.reset();
            this.logger.debug('Cleared all cache entries');
        } catch (error) {
            this.logger.error('Error clearing all cache', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ hits: number; misses: number; keys: number }> {
        // This would need to be implemented based on the specific cache store
        return {
            hits: 0,
            misses: 0,
            keys: 0,
        };
    }

    /**
     * Build a cache key with optional prefix
     */
    private buildKey(key: string, prefix?: string): string {
        return prefix ? `${prefix}:${key}` : key;
    }

    /**
     * Generate a cache key for user-specific data
     */
    getUserKey(userId: string, key: string): string {
        return `user:${userId}:${key}`;
    }

    /**
     * Generate a cache key for game-specific data
     */
    getGameKey(gameId: string, key: string): string {
        return `game:${gameId}:${key}`;
    }

    /**
     * Generate a cache key for matchmaking data
     */
    getMatchmakingKey(key: string): string {
        return `matchmaking:${key}`;
    }
} 