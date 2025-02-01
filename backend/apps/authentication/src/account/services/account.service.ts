import { JwtRefreshData } from '@common/auth/model/jwt-refresh-data.interface';
import { JwtData } from '@common/auth/model/jwt-user.interface';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { env } from '../../env';
import { EmailNotFoundException } from '../exceptions/email-not-found.exception';
import { InvalidJwtRefreshException } from '../exceptions/invalid-jwt-refresh.exception';
import { JwtRefreshNotFoundException } from '../exceptions/jwt-refresh-not-found.exception';
import { WrongPasswordException } from '../exceptions/wrong-password.exception';
import { Account } from '../model/account.interface';
import { JwtCredentials } from '../model/jwt-credentials.interface';
import { AccountRepositoryService } from '../repositories/account.repository.service';
import { JwtRepositoryService } from '../repositories/jwt.repository.service';

export interface Register {
  email: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface Login {
  email: string;
  password: string;
}

export type FindAccount = { id: string } | { email: string };

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountRepository: AccountRepositoryService,
    private readonly jwtRepository: JwtRepositoryService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new account in the system.
   *
   * @param register new account data
   * @returns newly created account data
   */
  async register(register: Register): Promise<Account> {
    const account = await this.accountRepository.insertAccount(register);
    this.logger.log(`New account registration. Username: "${account.username}", id: ${account.id}`);
    return account;
  }

  /**
   * Log an account into the system, returning a session token and a refresh token.
   *
   * @param login account credentials
   * @returns generated jwts
   */
  async login({ email, password }: Login): Promise<JwtCredentials> {
    const account = await this.accountRepository.findAccount({ email });

    if (!account) {
      throw new EmailNotFoundException();
    }
    if (!(await this.comparePassword(password, account.password))) {
      this.logger.log(`Failed login attempt for account id: ${account.id} (wrong password)`);
      throw new WrongPasswordException();
    }

    // Do in background not to slow down the login process
    this.accountRepository
      .updateAccount(account.id, { lastLoginAt: new Date() })
      .catch((err: Error) =>
        this.logger.error(`Could not update last login date for account id: ${account.id}`, err),
      );

    this.logger.log(`User "${account.username}" (id: ${account.id}) logged in`);
    return this.generateJwtTokens(account);
  }

  /**
   * Generate new session token and new refresh token, performing refresh token rotation, invalidating the old one.
   *
   * @param jwtRefresh current jwt refresh token
   * @returns new session token and refresh token
   */
  async refresh(jwtRefresh: string): Promise<JwtCredentials> {
    let accountId, jti;
    try {
      ({ accountId, jti } = await this.jwtService.verifyAsync<JwtRefreshData>(jwtRefresh, {
        publicKey: env.jwtRefreshPublicKey,
      }));
    } catch (_err) {
      throw new InvalidJwtRefreshException();
    }

    if (!(await this.jwtRepository.deleteJwtRefresh(accountId, jti))) {
      throw new JwtRefreshNotFoundException();
    }

    const account = await this.accountRepository.findAccount({ id: accountId });
    if (!account) {
      this.logger.error(`Couldn't find account with id ${accountId} while refreshing token`);
      throw new Error('Account id not found while refreshing token: this should not happen');
    }

    return this.generateJwtTokens(account);
  }

  /**
   * Search for an account using given filter.
   *
   * @param filter query filter
   * @returns account if found, undefined otherwise
   */
  async findAccount(filter: FindAccount): Promise<Account | undefined> {
    return this.accountRepository.findAccount({ ...filter });
  }

  private async generateJwtTokens(account: Account): Promise<JwtCredentials> {
    const jwtData: JwtData = {
      accountId: account.id,
      email: account.email,
      username: account.username,
      isAdmin: account.isAdmin,
    };

    // Create jwt token
    const jwt = await this.jwtService.signAsync(jwtData, {
      expiresIn: env.jwtExpireAfterMs / 1000,
    });

    // Create and store jwt refresh token
    const jwtRefreshJti = randomUUID();
    const jwtRefresh = await this.jwtService.signAsync(
      { jti: jwtRefreshJti, accountId: jwtData.accountId },
      {
        expiresIn: env.jwtRefreshExpireAfterMs / 1000,
        privateKey: env.jwtRefreshPrivateKey,
      },
    );
    await this.jwtRepository.storeJwtRefresh(
      account.id,
      jwtRefreshJti,
      env.jwtRefreshExpireAfterMs / 1000,
    );

    // Calculate expiration times (useful for cookie 'expires' field)
    const now = Date.now();
    const jwtExpires = new Date(now + env.jwtExpireAfterMs);
    const jwtRefreshExpires = new Date(now + env.jwtRefreshExpireAfterMs);

    return { jwt, jwtExpires, jwtRefresh, jwtRefreshExpires };
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
