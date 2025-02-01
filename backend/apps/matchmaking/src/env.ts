import { CommonAppEnvironment } from '@common/env';
import { MATCHMAKER_PACKAGE_NAME } from '@common/matchmaking/proto/matchmaker.pb';
import { RANKING_PACKAGE_NAME } from '@common/matchmaking/proto/ranking.pb';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { Env, getEnvironment } from '@pietrobassi/environment';
import { IsString } from 'class-validator';
import { addReflectionToGrpcConfig } from 'nestjs-grpc-reflection';
import { join } from 'path';

export class MatchmakingAppEnvironment extends CommonAppEnvironment {
  @Env()
  @IsString()
  postgresUrl: string;
}

export const env = getEnvironment<MatchmakingAppEnvironment>(MatchmakingAppEnvironment, {
  envFilePath: './apps/matchmaking/.env',
  loadEnvFile: true,
});

export const grpcClientOptions: GrpcOptions = addReflectionToGrpcConfig({
  transport: Transport.GRPC,
  options: {
    url: env.grpcMatchmakingUrl,
    package: [MATCHMAKER_PACKAGE_NAME, RANKING_PACKAGE_NAME],
    protoPath: [
      join(__dirname, 'matchmaking/proto/matchmaker.proto'),
      join(__dirname, 'matchmaking/proto/ranking.proto'),
    ],
    loader: {
      arrays: true,
      enums: String,
    },
  },
});
