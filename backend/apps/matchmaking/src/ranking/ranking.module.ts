import { Module } from '@nestjs/common';
import { NatsJetStreamTransport } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { env } from '../env';
import { RankingController } from './ranking.controller';
import { RankingRepositoryService } from './repositories/ranking.repository.service';
import { RankingService } from './services/ranking.service';
import { StreamService } from './services/stream.service';

@Module({
  imports: [
    NatsJetStreamTransport.register({
      connectionOptions: {
        servers: env.natsUrl,
        user: env.natsUser,
        pass: env.natsPassword,
        name: 'matchmaking-publisher',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
    }),
  ],
  controllers: [RankingController],
  providers: [RankingService, RankingRepositoryService, StreamService],
  exports: [RankingService],
})
export class RankingModule {}
