import { ContextGuard } from '@common/auth/guards/context.guard';
import { GAME_PACKAGE_NAME } from '@common/game/proto/game.pb';
import { contextInterceptor } from '@common/protobuf/context.interceptor';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsModule } from 'nestjs-cls';
import { GrpcReflectionModule } from 'nestjs-grpc-reflection';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { env, grpcClientOptions } from './env';
import { MatchmakerModule } from './matchmaker/matchmaker.module';
import { RankingModule } from './ranking/ranking.module';

@Module({
  imports: [
    ClientsModule.register({
      isGlobal: true,
      clients: [
        {
          name: GAME_PACKAGE_NAME,
          transport: Transport.GRPC,
          options: {
            url: env.grpcGameUrl,
            package: GAME_PACKAGE_NAME,
            protoPath: join(__dirname, 'game/proto/game.proto'),
            channelOptions: {
              interceptors: [contextInterceptor(env.jwtName)],
            },
          },
        },
      ],
    }),
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
    RankingModule,
    MatchmakerModule,
    DatabaseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ContextGuard,
    },
  ],
})
export class AppModule {}
