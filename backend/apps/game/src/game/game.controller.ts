import {
  CheckGameResultRequestPb,
  CreateGameRequestPb,
  CreateGameResponsePb,
  GameServiceController,
  GetGameStateRequestPb,
  GetGameStateResponsePb,
  MakeMoveRequestPb,
  MakeMoveResponsePb,
  ResignRequestPb,
  ResignResponsePb,
} from '@common/game/proto/game.pb';

import { GameType, UnknownGameTypeException, isGameType } from '@common/game/model/game-type';
import { GAME_SERVICE_NAME } from '@common/game/proto/game.pb';
import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { GameNotFoundException } from './exceptions/game-not-found.exception';
import { GameOverException } from './exceptions/game-over.exception';
import { InvalidMoveException } from './exceptions/invalid-move.exception';
import { TurnException } from './exceptions/turn.exception';
import { GameService } from './services/game.service';

@Controller()
export class GameController implements GameServiceController {
  constructor(private readonly gameService: GameService) {}

  @GrpcMethod(GAME_SERVICE_NAME, 'createGame')
  async createGame(request: CreateGameRequestPb): Promise<CreateGameResponsePb> {
    const validGameType = this.validateGameType(request.gameType);
    const chessGame = await this.gameService.createGame({
      ...request,
      gameType: validGameType,
    });
    return { gameId: chessGame.id, gameRepr: chessGame.toString() };
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'getGameState')
  async getGameState(request: GetGameStateRequestPb): Promise<GetGameStateResponsePb> {
    try {
      const chessGame = await this.gameService.getGameOrThrow(request.gameId);
      return { gameRepr: chessGame.toString() };
    } catch (err) {
      if (err instanceof GameNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Game not found',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'checkGameResult')
  async checkGameResult(request: CheckGameResultRequestPb): Promise<void> {
    try {
      const chessGame = await this.gameService.getGameOrThrow(request.gameId);
      await this.gameService.checkGameResult(chessGame);
    } catch (err) {
      if (err instanceof GameNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Game not found',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'makeMove')
  async makeMove(request: MakeMoveRequestPb): Promise<MakeMoveResponsePb> {
    try {
      const chessGame = await this.gameService.makeMove(request);
      return { gameRepr: chessGame.toString() };
    } catch (err) {
      if (err instanceof InvalidMoveException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Invalid move',
        });
      }
      if (err instanceof GameNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Game not found',
        });
      }
      if (err instanceof TurnException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Wrong turn',
        });
      }
      if (err instanceof GameOverException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Game over',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'resign')
  async resign(request: ResignRequestPb): Promise<ResignResponsePb> {
    try {
      const chessGame = await this.gameService.resign(request);
      return { gameRepr: chessGame.toString() };
    } catch (err) {
      if (err instanceof GameNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Game not found',
        });
      }
      if (err instanceof GameOverException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Game over',
        });
      }
      throw err;
    }
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
