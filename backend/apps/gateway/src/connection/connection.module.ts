import { Global, Module } from '@nestjs/common';
import { GameModule } from '../game/game.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { ConnectionGateway } from './connection.gateway';

@Global()
@Module({
  imports: [MatchmakingModule, GameModule],
  providers: [ConnectionGateway],
})
export class ConnectionModule {}
