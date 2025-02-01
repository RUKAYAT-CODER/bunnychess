import { Module } from '@nestjs/common';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [MatchmakingModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
