import { EloChangeEvent } from '@common/matchmaking/stream/elo-change.event';
import { MatchmakingSubject } from '@common/matchmaking/stream/matchmaking.subject';
import { PendingGameReadyEvent } from '@common/matchmaking/stream/pending-game-ready.event';
import { PendingGameTimeoutEvent } from '@common/matchmaking/stream/pending-game-timeout.event';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { WebsocketService } from '../core/websocket/websocket.service';

@Controller()
export class MatchmakingListenerController {
  constructor(private readonly websocketService: WebsocketService) {}

  @EventPattern(MatchmakingSubject.PendingGameReady)
  public async gameReadyHandler(
    @Payload() { accountId0, accountId1, pendingGameId }: PendingGameReadyEvent,
  ) {
    [accountId0, accountId1].forEach((accountId) => {
      this.websocketService.socket
        .to(accountId)
        .emit('matchmaking:pending-game-ready', { pendingGameId });
    });
  }

  @EventPattern(MatchmakingSubject.PendingGameTimeout)
  public async pendingGameTimeoutHandler(
    @Payload() { accountId0, accountId1, pendingGameId }: PendingGameTimeoutEvent,
  ) {
    [accountId0, accountId1].forEach((accountId) => {
      this.websocketService.socket
        .to(accountId)
        .emit('matchmaking:pending-game-timeout', { pendingGameId });
    });
  }

  @EventPattern(MatchmakingSubject.EloChange)
  public async eloChangeHandler(
    @Payload() { accountId, newElo, eloChange, ranked }: EloChangeEvent,
  ) {
    if (ranked) {
      this.websocketService.socket.to(accountId).emit('matchmaking:elo-change', {
        newElo: Math.round(newElo),
        eloChange: Math.round(eloChange),
      });
    }
  }
}
