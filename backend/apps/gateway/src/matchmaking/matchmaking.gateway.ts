import { Jwt } from '@common/auth/decorators/jwt.decorator';
import { RequireUser } from '@common/auth/decorators/require-user.decorator';
import { JwtData } from '@common/auth/model/jwt-user.interface';
import { ConnectedSocket, MessageBody, SubscribeMessage } from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { Ack } from '../core/websocket/websocket-ack';
import { WebsocketController } from '../core/websocket/websocket-controller.decorator';
import { GameService } from '../game/game.service';
import { AcceptGameRequestDto } from './dtos/accept-game-request.dto';
import { AddToQueueRequestDto } from './dtos/add-to-queue-request.dto';
import { JoinGameRequestDto } from './dtos/join-game-request.dto';
import { MatchmakingService } from './matchmaking.service';

@WebsocketController()
export class MatchmakingGateway {
  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly gameService: GameService,
  ) {}

  @SubscribeMessage('matchmaking:add-to-queue')
  @RequireUser()
  async handleAddToQueue(
    @MessageBody() { gameType, ranked }: AddToQueueRequestDto,
    @Jwt() { accountId }: JwtData,
  ): Promise<Ack> {
    await this.matchmakingService.addToQueue({
      accountId,
      gameType,
      ranked,
    });
    return new Ack();
  }

  @SubscribeMessage('matchmaking:remove-from-queue')
  @RequireUser()
  async handleRemoveFromQueue(@Jwt() { accountId }: JwtData): Promise<Ack> {
    await this.matchmakingService.removeFromQueue({ accountId });
    return new Ack();
  }

  @SubscribeMessage('matchmaking:accept-pending-game')
  @RequireUser()
  async handleAcceptPendingGame(
    @MessageBody() { pendingGameId }: AcceptGameRequestDto,
    @Jwt() { accountId }: JwtData,
  ): Promise<Ack> {
    await this.matchmakingService.acceptPendingGame({ accountId, pendingGameId });
    return new Ack();
  }

  @SubscribeMessage('matchmaking:join-game')
  @RequireUser()
  async handleJoinGame(
    @MessageBody() { gameId }: JoinGameRequestDto,
    @ConnectedSocket() client: Socket,
    @Jwt() { accountId }: JwtData,
  ): Promise<string> {
    const accountStatus = await this.matchmakingService.getAccountStatus({ accountId });
    if (accountStatus.status === 'playing' && accountStatus.gameId === gameId) {
      client.join(gameId);
    }
    const gameState = await this.gameService.getGameState({ gameId });
    return gameState.gameRepr;
  }

  @SubscribeMessage('matchmaking:join-lobby')
  @RequireUser()
  async handleJoinLobby(@ConnectedSocket() client: Socket): Promise<void> {
    client.join('lobby');
    client.emit('matchmaking:queue-sizes', await this.matchmakingService.getCachedQueueSizes());
  }

  @SubscribeMessage('matchmaking:leave-lobby')
  @RequireUser()
  async handleLeaveLobby(@ConnectedSocket() client: Socket): Promise<void> {
    client.leave('lobby');
  }
}
