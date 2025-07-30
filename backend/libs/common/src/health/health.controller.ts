import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly healthService: HealthService,
    ) { }

    @Get()
    @HealthCheck()
    async check(): Promise<HealthIndicatorResult> {
        return this.health.check([
            () => this.healthService.checkDatabase(),
            () => this.healthService.checkRedis(),
            () => this.healthService.checkNats(),
        ]);
    }

    @Get('ready')
    @HealthCheck()
    async readiness(): Promise<HealthIndicatorResult> {
        return this.health.check([
            () => this.healthService.checkDatabase(),
            () => this.healthService.checkRedis(),
        ]);
    }

    @Get('live')
    @HealthCheck()
    async liveness(): Promise<HealthIndicatorResult> {
        return this.health.check([
            () => this.healthService.checkBasic(),
        ]);
    }
} 