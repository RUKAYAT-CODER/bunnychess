import { ContextGuard } from '@common/auth/guards/context.guard';
import { ACCOUNT_PACKAGE_NAME } from '@common/authentication/proto/account.pb';
import { GAME_PACKAGE_NAME } from '@common/game/proto/game.pb';
import { MATCHMAKER_PACKAGE_NAME } from '@common/matchmaking/proto/matchmaker.pb';
import { RANKING_PACKAGE_NAME } from '@common/matchmaking/proto/ranking.pb';
import { contextInterceptor } from '@common/protobuf/context.interceptor';
import { GrpcToHttpExceptionFilter } from '@common/protobuf/grpc-to-http-exception.filter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { join } from 'path';
import { AccountModule } from './account/account.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ChatModule } from './chat/chat.module';
import { ConnectionModule } from './connection/connection.module';
import { GatewayThrottlerGuard } from './core/throttler/gateway-throttler.guard';
import { WebsocketModule } from './core/websocket/websocket.module';
import { env } from './env';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';

@Module({
  imports: [
    ClientsModule.register({
      isGlobal: true,
      clients: [
        {
          name: ACCOUNT_PACKAGE_NAME,
          transport: Transport.GRPC,
          options: {
            url: env.grpcAuthenticationUrl,
            package: ACCOUNT_PACKAGE_NAME,
            protoPath: join(__dirname, 'authentication/proto/account.proto'),
            channelOptions: {
              interceptors: [contextInterceptor(env.jwtName)],
            },
          },
        },
        {
          name: MATCHMAKER_PACKAGE_NAME,
          transport: Transport.GRPC,
          options: {
            url: env.grpcMatchmakingUrl,
            package: MATCHMAKER_PACKAGE_NAME,
            protoPath: join(__dirname, 'matchmaking/proto/matchmaker.proto'),
            channelOptions: {
              interceptors: [contextInterceptor(env.jwtName)],
            },
          },
        },
        {
          name: RANKING_PACKAGE_NAME,
          transport: Transport.GRPC,
          options: {
            url: env.grpcMatchmakingUrl,
            package: RANKING_PACKAGE_NAME,
            protoPath: join(__dirname, 'matchmaking/proto/ranking.proto'),
            channelOptions: {
              interceptors: [contextInterceptor(env.jwtName)],
            },
          },
        },
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
    ClsModule.forRoot({
      global: true,
      guard: {
        mount: true,
      },
    }),
    JwtModule.register({
      publicKey: env.jwtPublicKey,
      verifyOptions: { algorithms: [env.jwtAlgorithm] },
      global: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 100,
        },
      ],
      storage: new ThrottlerStorageRedisService({
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword,
      }),
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
    WebsocketModule,
    ConnectionModule,
    AuthenticationModule,
    MatchmakingModule,
    AccountModule,
    GameModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcToHttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GatewayThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      inject: [Reflector],
      useFactory: (reflector: Reflector) => {
        return new ClassSerializerInterceptor(reflector, {
          excludeExtraneousValues: true,
        });
      },
    },
  ],
})
export class AppModule {}
