import { ACCOUNT_PACKAGE_NAME } from '@common/authentication/proto/account.pb';
import { CommonAppEnvironment } from '@common/env';
import { Transport } from '@nestjs/microservices';
import { Env, getEnvironment } from '@pietrobassi/environment';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import ms from 'ms';
import { addReflectionToGrpcConfig } from 'nestjs-grpc-reflection';
import { join } from 'path';

export class AuthenticationAppEnvironment extends CommonAppEnvironment {
  @Env()
  @IsString()
  postgresUrl: string;

  @Env()
  @IsString()
  @Transform((prop) => prop.value.replace(/\\n/g, '\n'))
  jwtPrivateKey: string;

  @Env()
  @IsString()
  @Transform((prop) => prop.value.replace(/\\n/g, '\n'))
  jwtRefreshPrivateKey: string;

  @Env()
  @IsString()
  @Transform((prop) => prop.value.replace(/\\n/g, '\n'))
  jwtRefreshPublicKey: string;

  @Env()
  @IsNumber()
  @Transform((prop) => ms(prop.value as string))
  jwtExpireAfterMs: number;

  @Env()
  @IsNumber()
  @Transform((prop) => ms(prop.value as string))
  jwtRefreshExpireAfterMs: number;
}

export const env = getEnvironment<AuthenticationAppEnvironment>(AuthenticationAppEnvironment, {
  envFilePath: './apps/authentication/.env',
  loadEnvFile: true,
});

export const grpcClientOptions = addReflectionToGrpcConfig({
  transport: Transport.GRPC,
  options: {
    url: env.grpcAuthenticationUrl,
    package: ACCOUNT_PACKAGE_NAME,
    protoPath: join(__dirname, 'authentication/proto/account.proto'),
    loader: {
      arrays: true,
      enums: String,
    },
  },
});
