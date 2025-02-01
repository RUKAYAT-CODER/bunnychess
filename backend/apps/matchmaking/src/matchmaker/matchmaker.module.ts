import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NatsJetStreamTransport } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { env } from '../env';
import { RankingModule } from '../ranking/ranking.module';
import { GameListenerController } from './game.listener.controller';
import { MatchPlayersProcessor } from './job/match-players.processor';
import { MATCH_PLAYERS_QUEUE } from './job/match-players.queue';
import { PendingGameProcessor } from './job/pending-game.processor';
import { PENDING_GAME_QUEUE } from './job/pending-game.queue';
import { MatchmakerController } from './matchmaker.controller';
import { MatchmakingQueueRepositoryService } from './repositories/matchmaking-queue.repository.service';
import { PendingGameRepositoryService } from './repositories/pending-game.repository.service';
import { PlayerStatusRepositoryService } from './repositories/player-status.repository.service';
import { MatchmakingQueueService } from './services/matchmaking-queue.service';
import { PendingGameService } from './services/pending-game.service';
import { PlayerStatusService } from './services/player-status.service';
import { StreamService } from './services/stream.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MATCH_PLAYERS_QUEUE,
      connection: {
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword,
      },
    }),
    BullModule.registerQueue({
      name: PENDING_GAME_QUEUE,
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
        name: 'matchmaking-publisher',
        reconnect: true,
        reconnectDelayHandler() {
          return 1000;
        },
        maxReconnectAttempts: -1,
      },
    }),
    RankingModule,
  ],
  controllers: [MatchmakerController, GameListenerController],
  providers: [
    MatchmakingQueueService,
    PendingGameService,
    MatchPlayersProcessor,
    PendingGameProcessor,
    MatchmakingQueueRepositoryService,
    PendingGameRepositoryService,
    PlayerStatusService,
    PlayerStatusRepositoryService,
    StreamService,
  ],
})
export class MatchmakerModule {}
