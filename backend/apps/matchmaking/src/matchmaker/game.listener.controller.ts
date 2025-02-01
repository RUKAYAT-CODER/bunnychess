import { GameOverEvent } from '@common/game/stream/game-over.event';
import { GameSubject } from '@common/game/stream/game.subject';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { NatsJetStreamContext } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { RankingMetadata } from '../ranking/model/ranking-metadata.interface';
import { RankingService } from '../ranking/services/ranking.service';
import { PlayerStatusService } from './services/player-status.service';

@Controller()
export class GameListenerController {
  private readonly logger = new Logger(GameListenerController.name);

  constructor(
    private readonly playerStatusService: PlayerStatusService,
    private readonly rankingService: RankingService,
  ) {}

  @EventPattern(GameSubject.GameOver)
  public async gameOverHandler(
    @Payload()
    { accountId0, accountId1, gameId, gameType, metadata, winnerAccountId }: GameOverEvent,
    @Ctx() context: NatsJetStreamContext,
  ) {
    this.deletePlayingPlayerStatuses(accountId0, accountId1, gameId);
    const rankingMetadata = JSON.parse(metadata) as RankingMetadata;
    await this.rankingService.processGameResult({
      accountId0,
      accountId1,
      winnerAccountId,
      gameId,
      gameType,
      rankingMetadata,
    });
    context.message.ack();
  }

  private deletePlayingPlayerStatuses(accountId0: string, accountId1: string, gameId: string) {
    this.playerStatusService
      .deletePlayingPlayerStatuses({
        accountId0,
        accountId1,
        gameId,
      })
      .catch((err) =>
        this.logger.error(
          `Error while deleting ${accountId0} and/or ${accountId1} player statuses after ${gameId} ended`,
          err,
        ),
      );
  }
}
