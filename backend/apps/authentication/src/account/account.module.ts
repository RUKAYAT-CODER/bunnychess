import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { env } from '../env';
import { AccountController } from './account.controller';
import { AccountRepositoryService } from './repositories/account.repository.service';
import { JwtRepositoryService } from './repositories/jwt.repository.service';
import { AccountService } from './services/account.service';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        url: `redis://${env.redisHost}:${env.redisPort}`,
        password: env.redisPassword,
      },
    }),
  ],
  providers: [AccountService, AccountRepositoryService, JwtRepositoryService],
  controllers: [AccountController],
})
export class AccountModule {}
