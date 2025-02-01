import { Controller } from '@nestjs/common';

import {
  ACCOUNT_SERVICE_NAME,
  AccountPb,
  AccountServiceController,
  FindAccountRequestPb,
  LoginRequestPb,
  LoginResponsePb,
  RefreshRequestPb,
  RegisterRequestPb,
} from '@common/authentication/proto/account.pb';
import { status } from '@grpc/grpc-js';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { EmailAlreadyExistsException } from './exceptions/email-already-exists.exception';
import { EmailNotFoundException } from './exceptions/email-not-found.exception';
import { InvalidJwtRefreshException } from './exceptions/invalid-jwt-refresh.exception';
import { JwtRefreshNotFoundException } from './exceptions/jwt-refresh-not-found.exception';
import { UsernameAlreadyExistsException } from './exceptions/username-already-exists.exception';
import { WrongPasswordException } from './exceptions/wrong-password.exception';
import { AccountService, FindAccount } from './services/account.service';

@Controller()
export class AccountController implements AccountServiceController {
  constructor(private readonly accountService: AccountService) {}

  @GrpcMethod(ACCOUNT_SERVICE_NAME, 'register')
  async register(request: RegisterRequestPb): Promise<AccountPb> {
    try {
      return await this.accountService.register(request);
    } catch (err) {
      if (err instanceof EmailAlreadyExistsException) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'An account with this email already exists',
        });
      }
      if (err instanceof UsernameAlreadyExistsException) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Username already taken',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(ACCOUNT_SERVICE_NAME, 'login')
  async login(request: LoginRequestPb): Promise<LoginResponsePb> {
    try {
      return await this.accountService.login(request);
    } catch (err) {
      if (err instanceof EmailNotFoundException) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Email is not associated with any account',
        });
      }
      if (err instanceof WrongPasswordException) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Wrong password',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(ACCOUNT_SERVICE_NAME, 'refresh')
  async refresh(request: RefreshRequestPb): Promise<LoginResponsePb> {
    try {
      return await this.accountService.refresh(request.jwtRefresh);
    } catch (err) {
      if (err instanceof InvalidJwtRefreshException) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Jwt refresh token is not valid',
        });
      }
      if (err instanceof JwtRefreshNotFoundException) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Jwt refresh token not found',
        });
      }
      throw err;
    }
  }

  @GrpcMethod(ACCOUNT_SERVICE_NAME, 'findAccount')
  async findAccount({ id, email }: FindAccountRequestPb): Promise<AccountPb> {
    if ([id, email].filter(Boolean).length !== 1) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Exactly one between "id" and "email" must be set',
      });
    }
    const account = await this.accountService.findAccount({ id, email } as FindAccount);
    if (!account) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Account not found',
      });
    }
    return account;
  }
}
