import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { env } from '../env';
import { GameModule } from '../game/game.module';
import { NotifyQueueSizesProcessor } from './job/notify-queue-sizes.processor';
import { NOTIFY_QUEUE_SIZES } from './job/notify-queue-sizes.queue';
import { MatchmakingGateway } from './matchmaking.gateway';
import { MatchmakingListenerController } from './matchmaking.listener.controller';
import { MatchmakingService } from './matchmaking.service';
import { QueueSizesRepositoryService } from './queue-sizes.repository.service';

@Module({
  imports: [
    GameModule,
    BullModule.registerQueue({
      name: NOTIFY_QUEUE_SIZES,
      connection: {
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword,
      },
    }),
  ],
  providers: [
    MatchmakingGateway,
    MatchmakingService,
    NotifyQueueSizesProcessor,
    QueueSizesRepositoryService,
  ],
  controllers: [MatchmakingListenerController],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
