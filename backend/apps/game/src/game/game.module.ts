import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NatsJetStreamTransport } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { env } from '../env';
import { GameController } from './game.controller';
import { CheckGameProcessor } from './job/check-game.processor';
import { CHECK_GAME_QUEUE } from './job/check-game.queue';
import { GameRepositoryService } from './repositories/game.repository.service';
import { GameService } from './services/game.service';
import { StreamService } from './services/stream.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHECK_GAME_QUEUE,
      connection: {
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword,
      },
    }),
    NatsJetStreamTransport.register({
      connectionOptions: {
        servers: env.natsUrl,
        user: env.natsUser,
        pass: env.natsPassword,
        name: 'game-publisher',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
    }),
  ],
  controllers: [GameController],
  providers: [GameService, GameRepositoryService, StreamService, CheckGameProcessor],
})
export class GameModule {}
