import {
  ACCOUNT_PACKAGE_NAME,
  ACCOUNT_SERVICE_NAME,
  AccountPb,
  AccountServiceClient,
  LoginRequestPb,
  LoginResponsePb,
  RefreshRequestPb,
  RegisterRequestPb,
} from '@common/authentication/proto/account.pb';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  private grpcAccountService: AccountServiceClient;

  constructor(@Inject(ACCOUNT_PACKAGE_NAME) private readonly accountClient: ClientGrpc) {}

  onModuleInit(): void {
    this.grpcAccountService =
      this.accountClient.getService<AccountServiceClient>(ACCOUNT_SERVICE_NAME);
  }

  async register(registerRequest: RegisterRequestPb): Promise<AccountPb> {
    return firstValueFrom(this.grpcAccountService.register(registerRequest));
  }

  async login(loginRequest: LoginRequestPb): Promise<LoginResponsePb> {
    return firstValueFrom(this.grpcAccountService.login(loginRequest));
  }

  async refresh(refreshRequest: RefreshRequestPb): Promise<LoginResponsePb> {
    return firstValueFrom(this.grpcAccountService.refresh(refreshRequest));
  }
}
