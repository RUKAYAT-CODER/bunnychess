import {
  ACCOUNT_PACKAGE_NAME,
  ACCOUNT_SERVICE_NAME,
  AccountPb,
  AccountServiceClient,
  FindAccountRequestPb,
} from '@common/authentication/proto/account.pb';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AccountService implements OnModuleInit {
  private grpcAccountService: AccountServiceClient;

  constructor(@Inject(ACCOUNT_PACKAGE_NAME) private readonly accountClient: ClientGrpc) {}

  onModuleInit(): void {
    this.grpcAccountService =
      this.accountClient.getService<AccountServiceClient>(ACCOUNT_SERVICE_NAME);
  }

  async findAccount(findAccountRequest: FindAccountRequestPb): Promise<AccountPb> {
    return firstValueFrom(this.grpcAccountService.findAccount(findAccountRequest));
  }
}
