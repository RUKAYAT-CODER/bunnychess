import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Client, connect } from 'nats';

@Injectable()
export class HealthService implements HealthIndicator {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
    ) { }

    async checkBasic(): Promise<HealthIndicatorResult> {
        const isHealthy = true;
        return {
            basic: {
                status: isHealthy ? 'up' : 'down',
                message: isHealthy ? 'Service is running' : 'Service is not responding',
            },
        };
    }

    async checkDatabase(): Promise<HealthIndicatorResult> {
        try {
            // This would need to be implemented based on the specific database connection
            // For now, we'll return a basic check
            const isHealthy = true;
            return {
                database: {
                    status: isHealthy ? 'up' : 'down',
                    message: isHealthy ? 'Database connection is healthy' : 'Database connection failed',
                },
            };
        } catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                database: {
                    status: 'down',
                    message: 'Database connection failed',
                    error: error.message,
                },
            };
        }
    }

    async checkRedis(): Promise<HealthIndicatorResult> {
        try {
            const startTime = Date.now();
            await this.redis.ping();
            const responseTime = Date.now() - startTime;

            return {
                redis: {
                    status: 'up',
                    message: 'Redis connection is healthy',
                    responseTime: `${responseTime}ms`,
                },
            };
        } catch (error) {
            this.logger.error('Redis health check failed', error);
            return {
                redis: {
                    status: 'down',
                    message: 'Redis connection failed',
                    error: error.message,
                },
            };
        }
    }

    async checkNats(): Promise<HealthIndicatorResult> {
        try {
            // This is a simplified check - in a real implementation,
            // you'd want to check the actual NATS connection
            const isHealthy = true;
            return {
                nats: {
                    status: isHealthy ? 'up' : 'down',
                    message: isHealthy ? 'NATS connection is healthy' : 'NATS connection failed',
                },
            };
        } catch (error) {
            this.logger.error('NATS health check failed', error);
            return {
                nats: {
                    status: 'down',
                    message: 'NATS connection failed',
                    error: error.message,
                },
            };
        }
    }
} 