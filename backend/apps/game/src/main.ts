import { getLogger } from '@common/logging/logger';
import { GrpcValidationPipe } from '@common/protobuf/grpc-validation.pipe';
import { useCustomProtobufTimestampHandler } from '@common/protobuf/protobufjs-wrapper';
import { streamConfig } from '@common/stream/stream-config';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy, MicroserviceOptions } from '@nestjs/microservices';
import { NatsJetStreamServer } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { AppModule } from './app.module';
import { env, grpcClientOptions } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLogger('Game'),
  });

  const gameListener: CustomStrategy = {
    strategy: new NatsJetStreamServer({
      connectionOptions: {
        servers: env.natsUrl,
        user: env.natsUser,
        pass: env.natsPassword,
        name: 'game',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
      consumerOptions: {},
      streamConfig,
    }),
  };

  app.connectMicroservice<MicroserviceOptions>(grpcClientOptions, { inheritAppConfig: true });
  app.connectMicroservice<CustomStrategy>(gameListener);
  app.useGlobalPipes(GrpcValidationPipe);
  app.enableShutdownHooks();
  useCustomProtobufTimestampHandler();

  await app.init();
  await app.startAllMicroservices();
}
bootstrap();
