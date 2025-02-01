import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebsocketService } from '../../core/websocket/websocket.service';
import { MatchmakingService } from '../matchmaking.service';
import { QueueSizesRepositoryService } from '../queue-sizes.repository.service';
import { NOTIFY_QUEUE_SIZES, NotifyQueueSizesJob } from './notify-queue-sizes.queue';

@Processor(NOTIFY_QUEUE_SIZES)
export class NotifyQueueSizesProcessor extends WorkerHost {
  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly queueSizesRepository: QueueSizesRepositoryService,
    private readonly websocketService: WebsocketService,
  ) {
    super();
  }

  async process(_job: Job<void, void, NotifyQueueSizesJob>): Promise<void> {
    const queueSizes = (await this.matchmakingService.getQueueSizes({})).queueSizes;
    const isNewValue = await this.queueSizesRepository.updateQueueSizes(queueSizes);
    if (isNewValue) {
      this.websocketService.socket.to('lobby').emit('matchmaking:queue-sizes', queueSizes);
    }
  }
}
