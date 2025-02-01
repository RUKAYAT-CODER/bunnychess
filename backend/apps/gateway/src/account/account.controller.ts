import { Jwt } from '@common/auth/decorators/jwt.decorator';
import { RequireUser } from '@common/auth/decorators/require-user.decorator';
import { JwtData } from '@common/auth/model/jwt-user.interface';
import { Controller, Get, Param } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { AccountService } from './account.service';
import { AccountResponseDto } from './dtos/account-response.dto';
import { MeResponseDto } from './dtos/me-response.dto';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly matchmakingService: MatchmakingService,
  ) {}

  @Get('/me')
  @RequireUser()
  async me(@Jwt() { accountId }: JwtData): Promise<MeResponseDto> {
    const [account, status, ranking] = await Promise.all([
      this.accountService.findAccount({ id: accountId }),
      this.matchmakingService.getAccountStatus({ accountId }),
      this.matchmakingService.getAccountRanking({ accountId }),
    ]);
    return plainToClass(MeResponseDto, {
      ...account,
      ...status,
      mmr: Math.round(ranking.rankedMmr),
    });
  }

  @Get('/:accountId')
  @RequireUser()
  async getAccount(@Param('accountId') accountId: string): Promise<AccountResponseDto> {
    const [account, ranking] = await Promise.all([
      this.accountService.findAccount({ id: accountId }),
      this.matchmakingService.getAccountRanking({ accountId }),
    ]);
    return plainToClass(AccountResponseDto, {
      id: account.id,
      username: account.username,
      isAdmin: account.isAdmin,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt,
      mmr: Math.round(ranking.rankedMmr),
    });
  }
}
