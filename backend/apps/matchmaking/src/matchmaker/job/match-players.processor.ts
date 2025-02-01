import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MatchmakingQueueService } from '../services/matchmaking-queue.service';
import { PendingGameService } from '../services/pending-game.service';
import { MATCH_PLAYERS_QUEUE, MatchPlayersJob, MatchPlayersPayload } from './match-players.queue';

/**
 * Periodically trigger players matching process, removing matched pairs from the queue and creating
 * a pending game instance for them.
 * Game will start when both players accept the pending game.
 */
@Processor(MATCH_PLAYERS_QUEUE)
export class MatchPlayersProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchPlayersProcessor.name);

  constructor(
    private readonly matchmakingQueueService: MatchmakingQueueService,
    private readonly pendingGameService: PendingGameService,
  ) {
    super();
  }

  async process(job: Job<MatchPlayersPayload, void, MatchPlayersJob>): Promise<void> {
    const { gameType, ranked } = job.data;
    const matchedPlayers = await this.matchmakingQueueService.matchPlayersInQueue({
      gameType: job.data.gameType,
      ranked: job.data.ranked,
    });

    matchedPlayers.forEach(([accountId0, accountId1]) =>
      // Execute all pairs matching in parallel
      (async () => {
        await this.matchmakingQueueService.removeMatchedPlayersFromQueue({
          accountId0,
          accountId1,
          gameType,
          ranked,
        });
        this.logger.log(
          `Matched players ${accountId0} and ${accountId1} for ${
            ranked ? 'ranked' : 'normal'
          } ${gameType} game`,
        );
        await this.pendingGameService.createPendingGame({
          accountId0,
          accountId1,
          gameType,
          ranked,
        });
      })().catch((err) =>
        this.logger.error(
          `Error while creating ${
            ranked ? 'ranked' : 'normal'
          } ${gameType} game for ${accountId0} and ${accountId1}`,
          err,
        ),
      ),
    );
  }
}
