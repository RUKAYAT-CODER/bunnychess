import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PendingGameService } from '../services/pending-game.service';
import { PENDING_GAME_QUEUE, PendingGameJob, TimeoutPayload } from './pending-game.queue';

/**
 * Cancel pending game if both players did not accept the game before timeout.
 */
@Processor(PENDING_GAME_QUEUE)
export class PendingGameProcessor extends WorkerHost {
  private readonly logger = new Logger(PendingGameProcessor.name);

  constructor(private readonly pendingGameService: PendingGameService) {
    super();
  }

  async process(job: Job<TimeoutPayload, void, PendingGameJob>): Promise<void> {
    const { pendingGameId, accountId0, accountId1 } = job.data;
    await this.pendingGameService.cancelPendingGame({ pendingGameId, accountId0, accountId1 });
    this.logger.log(
      `Canceled pending game ${pendingGameId} between ${accountId0} and ${accountId1} due to timeout`,
    );
  }
}
