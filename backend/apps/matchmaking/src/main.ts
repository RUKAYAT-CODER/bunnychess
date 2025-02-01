import { getLogger } from '@common/logging/logger';
import { GrpcValidationPipe } from '@common/protobuf/grpc-validation.pipe';
import { useCustomProtobufTimestampHandler } from '@common/protobuf/protobufjs-wrapper';
import { streamConfig } from '@common/stream/stream-config';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy, MicroserviceOptions } from '@nestjs/microservices';
import { NatsJetStreamServer } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { AppModule } from './app.module';
import { MatchmakingMigrator } from './database/migrations';
import { env, grpcClientOptions } from './env';

async function bootstrap() {
  await new MatchmakingMigrator(env.postgresUrl).migrateToLatest();
  const app = await NestFactory.create(AppModule, {
    logger: getLogger('Matchmaking'),
  });

  const matchmakingListener: CustomStrategy = {
    strategy: new NatsJetStreamServer({
      connectionOptions: {
        servers: env.natsUrl,
        user: env.natsUser,
        pass: env.natsPassword,
        name: 'matchmaking',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
      consumerOptions: {
        deliverGroup: 'matchmaking-group',
        durable: 'matchmaking-durable',
        deliverTo: 'matchmaking-messages',
        manualAck: true,
        ackPolicy: 'Explicit',
        ackWait: 5000,
      },
      streamConfig,
    }),
  };

  app.connectMicroservice<MicroserviceOptions>(grpcClientOptions, { inheritAppConfig: true });
  app.connectMicroservice<CustomStrategy>(matchmakingListener);
  app.useGlobalPipes(GrpcValidationPipe);
  app.enableShutdownHooks();
  useCustomProtobufTimestampHandler();

  await app.init();
  await app.startAllMicroservices();
}
bootstrap();
