import { getLogger } from '@common/logging/logger';
import { useCustomProtobufTimestampHandler } from '@common/protobuf/protobufjs-wrapper';
import { streamConfig } from '@common/stream/stream-config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NatsJetStreamServer } from '@pietrobassi/nestjs-nats-jetstream-transport';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './core/websocket/redis-io.adapter';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogger('Gateway'),
  });

  const gatewayListener: CustomStrategy = {
    strategy: new NatsJetStreamServer({
      connectionOptions: {
        servers: env.natsUrl,
        user: env.natsUser,
        pass: env.natsPassword,
        name: 'gateway',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
      consumerOptions: {
        deliverGroup: 'gateway-group',
        durable: 'gateway-durable',
        deliverTo: 'gateway-messages',
        manualAck: false,
      },
      streamConfig,
    }),
  };

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  // Needed to get the real IP address of the client when behind a proxy
  app.set('trust proxy', true);
  app.useWebSocketAdapter(redisIoAdapter);
  app.enableCors({ origin: env.corsUrls, credentials: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.connectMicroservice<CustomStrategy>(gatewayListener);
  app.enableShutdownHooks();
  useCustomProtobufTimestampHandler();

  await app.init();
  await app.startAllMicroservices();
  await app.listen(env.httpGatewayPort);
}
bootstrap();
