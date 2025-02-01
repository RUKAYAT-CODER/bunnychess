import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GameNotFoundException } from '../exceptions/game-not-found.exception';
import { GameService } from '../services/game.service';
import { CHECK_GAME_QUEUE, CheckGameJob, CheckGamePayload } from './check-game.queue';

/**
 * Check games after estimated maximum clock time to ensure all results are processed.
 * This is needed e.g. when both players disconnect or close the browser before game ends, without sending end game check signal.
 * Thanks to this processor, games are always checked after a certain amount of time and the result is always correctly processed.
 */
@Processor(CHECK_GAME_QUEUE)
export class CheckGameProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckGameProcessor.name);

  constructor(private readonly gameService: GameService) {
    super();
  }

  async process(job: Job<CheckGamePayload, void, CheckGameJob>): Promise<void> {
    const gameId = job.data.gameId;
    try {
      const chessGame = await this.gameService.getGameOrThrow(gameId);
      await this.gameService.checkGameResult(chessGame);
      this.logger.log(`Game ${gameId} result checked`);
    } catch (err) {
      if (err instanceof GameNotFoundException) {
        // All good, game was already processed: this is what should happen most of the times
        return;
      }
      this.logger.error(`Error while processing game ${gameId}`, err);
      throw err;
    }
  }
}
