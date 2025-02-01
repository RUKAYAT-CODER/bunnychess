import { ContextGuard } from '@common/auth/guards/context.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClsModule } from 'nestjs-cls';
import { GrpcReflectionModule } from 'nestjs-grpc-reflection';
import { AccountModule } from './account/account.module';
import { DatabaseModule } from './database/database.module';
import { env, grpcClientOptions } from './env';

@Module({
  imports: [
    AccountModule,
    GrpcReflectionModule.register(grpcClientOptions),
    DatabaseModule,
    ClsModule.forRoot({
      global: true,
      guard: {
        mount: true,
      },
    }),
    JwtModule.register({
      global: true,
      publicKey: env.jwtPublicKey,
      privateKey: env.jwtPrivateKey,
      signOptions: { algorithm: env.jwtAlgorithm },
      verifyOptions: { algorithms: [env.jwtAlgorithm] },
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
