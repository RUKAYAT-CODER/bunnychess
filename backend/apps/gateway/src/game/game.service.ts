import {
  CheckGameResultRequestPb,
  CheckGameResultResponsePb,
  GAME_PACKAGE_NAME,
  GAME_SERVICE_NAME,
  GameServiceClient,
  GetGameStateRequestPb,
  GetGameStateResponsePb,
  MakeMoveRequestPb,
  MakeMoveResponsePb,
  ResignRequestPb,
  ResignResponsePb,
} from '@common/game/proto/game.pb';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GameService implements OnModuleInit {
  private grpcGameService: GameServiceClient;

  constructor(@Inject(GAME_PACKAGE_NAME) private readonly gameClient: ClientGrpc) {}

  onModuleInit(): void {
    this.grpcGameService = this.gameClient.getService<GameServiceClient>(GAME_SERVICE_NAME);
  }

  async getGameState(getGameStateRequest: GetGameStateRequestPb): Promise<GetGameStateResponsePb> {
    return firstValueFrom(this.grpcGameService.getGameState(getGameStateRequest));
  }

  async checkGameResult(
    checkGameResultRequest: CheckGameResultRequestPb,
  ): Promise<CheckGameResultResponsePb> {
    return firstValueFrom(this.grpcGameService.checkGameResult(checkGameResultRequest));
  }

  async makeMove(makeMoveRequest: MakeMoveRequestPb): Promise<MakeMoveResponsePb> {
    return firstValueFrom(this.grpcGameService.makeMove(makeMoveRequest));
  }

  async resign(resignRequest: ResignRequestPb): Promise<ResignResponsePb> {
    return firstValueFrom(this.grpcGameService.resign(resignRequest));
  }
}
