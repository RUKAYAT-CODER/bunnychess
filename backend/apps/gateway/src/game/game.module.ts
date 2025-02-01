import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameListenerController } from './game.listener.controller';
import { GameService } from './game.service';

@Module({
  providers: [GameService, GameGateway],
  controllers: [GameListenerController],
  exports: [GameService],
})
export class GameModule {}
