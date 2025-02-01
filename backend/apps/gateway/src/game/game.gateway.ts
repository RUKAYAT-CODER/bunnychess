import { Jwt } from '@common/auth/decorators/jwt.decorator';
import { RequireUser } from '@common/auth/decorators/require-user.decorator';
import { JwtData } from '@common/auth/model/jwt-user.interface';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';

import { Ack } from '../core/websocket/websocket-ack';
import { WebsocketController } from '../core/websocket/websocket-controller.decorator';
import { CheckResultRequestDto } from './dtos/check-result-request.dto';
import { MakeMoveRequestDto } from './dtos/make-move-request.dto';
import { ResignRequestDto } from './dtos/resign-request.dto';
import { GameService } from './game.service';

@WebsocketController()
export class GameGateway {
  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('game:make-move')
  @RequireUser()
  async handleMakeMove(
    @MessageBody() { gameId, move }: MakeMoveRequestDto,
    @Jwt() { accountId }: JwtData,
  ): Promise<Ack> {
    await this.gameService.makeMove({ accountId, gameId, move });
    return new Ack();
  }

  @SubscribeMessage('game:resign')
  @RequireUser()
  async handleResign(
    @MessageBody() { gameId }: ResignRequestDto,
    @Jwt() { accountId }: JwtData,
  ): Promise<Ack> {
    await this.gameService.resign({ accountId, gameId });
    return new Ack();
  }

  @SubscribeMessage('game:check-result')
  @RequireUser()
  async handleCheckResult(@MessageBody() { gameId }: CheckResultRequestDto): Promise<void> {
    await this.gameService.checkGameResult({ gameId });
  }
}
