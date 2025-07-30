import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { RateLimitService } from './rate-limit.service';

@Module({
    providers: [SecurityService, RateLimitService],
    exports: [SecurityService, RateLimitService],
})
export class SecurityModule { } 