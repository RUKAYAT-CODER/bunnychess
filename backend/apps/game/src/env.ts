import { CommonAppEnvironment } from '@common/env';
import { GAME_PACKAGE_NAME } from '@common/game/proto/game.pb';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { getEnvironment } from '@pietrobassi/environment';
import { addReflectionToGrpcConfig } from 'nestjs-grpc-reflection';
import { join } from 'path';

export class GameAppEnvironment extends CommonAppEnvironment {}

export const env = getEnvironment<GameAppEnvironment>(GameAppEnvironment, {
  envFilePath: './apps/game/.env',
  loadEnvFile: true,
});

export const grpcClientOptions: GrpcOptions = addReflectionToGrpcConfig({
  transport: Transport.GRPC,
  options: {
    url: env.grpcGameUrl,
    package: GAME_PACKAGE_NAME,
    protoPath: join(__dirname, 'game/proto/game.proto'),
    loader: {
      arrays: true,
      enums: String,
    },
  },
});
