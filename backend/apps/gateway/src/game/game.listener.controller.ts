import { GameOverEvent } from '@common/game/stream/game-over.event';
import { GameStartEvent } from '@common/game/stream/game-start.event';
import { GameStateUpdateEvent } from '@common/game/stream/game-state-update.event';
import { GameSubject } from '@common/game/stream/game.subject';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { WebsocketService } from '../core/websocket/websocket.service';

@Controller()
export class GameListenerController {
  constructor(private readonly websocketService: WebsocketService) {}

  @EventPattern(GameSubject.GameStart)
  public async gameStartHandler(@Payload() { accountId0, accountId1, gameId }: GameStartEvent) {
    [accountId0, accountId1].forEach(async (accountId) => {
      this.websocketService.socket.to(accountId).emit('game:game-start', { gameId });
    });
  }

  @EventPattern(GameSubject.GameStateUpdate)
  public async gameStateUpdateHandler(
    @Payload() { accountId, gameId, move, seq, clocks }: GameStateUpdateEvent,
  ) {
    this.websocketService.socket.to(gameId).emit('game:game-state-update', {
      accountId,
      gameId,
      move,
      seq,
      clocks,
    });
  }

  @EventPattern(GameSubject.GameOver)
  public async gameOverHandler(
    @Payload() { gameId, winnerAccountId, gameOverReason }: GameOverEvent,
  ) {
    this.websocketService.socket.to(gameId).emit('game:game-over', {
      gameId,
      winnerAccountId,
      gameOverReason,
    });
  }
}
