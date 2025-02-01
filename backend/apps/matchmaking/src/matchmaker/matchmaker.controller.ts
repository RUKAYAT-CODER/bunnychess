import {
  AcceptPendingGameRequestPb,
  AddToQueueRequestPb,
  GetAccountStatusRequestPb,
  GetAccountStatusResponsePb,
  GetQueueSizesRequestPb,
  GetQueueSizesResponsePb,
  MATCHMAKER_SERVICE_NAME,
  MatchmakerServiceController,
  RemoveFromQueueRequestPb,
} from '@common/matchmaking/proto/matchmaker.pb';

import { GameType, UnknownGameTypeException, isGameType } from '@common/game/model/game-type';
import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PendingGameNotFoundException } from './exceptions/pending-game-not-found.exception';
import { PlayerStatusException } from './exceptions/player-status.exception';
import { MatchmakingQueueService } from './services/matchmaking-queue.service';
import { PendingGameService } from './services/pending-game.service';
import { PlayerStatusService } from './services/player-status.service';

@Controller()
export class MatchmakerController implements MatchmakerServiceController {
  constructor(
    private readonly matchmakingQueueService: MatchmakingQueueService,
    private readonly pendingGameService: PendingGameService,
    private readonly playerStatusService: PlayerStatusService,
  ) {}

  @GrpcMethod(MATCHMAKER_SERVICE_NAME, 'addToQueue')
  async addToQueue(request: AddToQueueRequestPb): Promise<void> {
    const validGameType = this.validateGameType(request.gameType);
    try {
      await this.matchmakingQueueService.addPlayerToQueue({ ...request, gameType: validGameType });
    } catch (err) {
      if (err instanceof PlayerStatusException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Player cannot join queue now',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(MATCHMAKER_SERVICE_NAME, 'acceptPendingGame')
  async acceptPendingGame(request: AcceptPendingGameRequestPb): Promise<void> {
    try {
      await this.pendingGameService.acceptPendingGame(request);
    } catch (err) {
      if (err instanceof PendingGameNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Pending game not found`,
        });
      }
      throw err;
    }
  }

  @GrpcMethod(MATCHMAKER_SERVICE_NAME, 'removeFromQueue')
  async removeFromQueue(request: RemoveFromQueueRequestPb): Promise<void> {
    try {
      await this.matchmakingQueueService.removePlayerFromQueue(request);
    } catch (err) {
      if (err instanceof PlayerStatusException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Player is not queued`,
        });
      }
      throw err;
    }
  }

  @GrpcMethod(MATCHMAKER_SERVICE_NAME, 'getQueueSizes')
  async getQueueSizes(_request: GetQueueSizesRequestPb): Promise<GetQueueSizesResponsePb> {
    return { queueSizes: await this.matchmakingQueueService.getQueueSizes() };
  }

  @GrpcMethod(MATCHMAKER_SERVICE_NAME, 'getAccountStatus')
  async getAccountStatus(request: GetAccountStatusRequestPb): Promise<GetAccountStatusResponsePb> {
    return this.playerStatusService.getPlayerStatus(request.accountId);
  }

  private validateGameType(gameType: unknown): GameType {
    try {
      isGameType(gameType);
      return gameType;
    } catch (err) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: (err as UnknownGameTypeException).message,
      });
    }
  }
}
