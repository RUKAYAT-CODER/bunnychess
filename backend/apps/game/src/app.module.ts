import { ContextGuard } from '@common/auth/guards/context.guard';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { GrpcReflectionModule } from 'nestjs-grpc-reflection';
import { env, grpcClientOptions } from './env';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    GameModule,
    GrpcReflectionModule.register(grpcClientOptions),
    ClsModule.forRoot({
      global: true,
      guard: {
        mount: true,
      },
    }),
    RedisModule.forRoot({
      config: {
        url: `redis://${env.redisHost}:${env.redisPort}`,
        password: env.redisPassword,
      },
    }),
    BullModule.forRoot({
      connection: {
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ContextGuard,
    },
  ],
})
export class AppModule {}
