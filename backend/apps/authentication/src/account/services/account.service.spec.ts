import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { env } from '../../env';
import { EmailNotFoundException } from '../exceptions/email-not-found.exception';
import { InvalidJwtRefreshException } from '../exceptions/invalid-jwt-refresh.exception';
import { JwtRefreshNotFoundException } from '../exceptions/jwt-refresh-not-found.exception';
import { WrongPasswordException } from '../exceptions/wrong-password.exception';
import { Account } from '../model/account.interface';
import { AccountRepositoryService } from '../repositories/account.repository.service';
import { JwtRepositoryService } from '../repositories/jwt.repository.service';
import { AccountService, Login, Register } from './account.service';

const now = new Date(2020, 3, 1);

describe('AccountService', () => {
  let service: AccountService;
  const accountRepository = mock<AccountRepositoryService>();
  const jwtRepository = mock<JwtRepositoryService>();
  let jwtService: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          publicKey:
            '-----BEGIN PUBLIC KEY-----\nMIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBAno/iSZh88EEoiVenw/lhfm4kk6/\ni8MVvV0NW1ro/wLXY13x11mB2xPzK51W/EDUbk1HMKCLaa0nj4sSxOs4+isALI/c\nWjCSqJdN/OLWEsl6SrxkBe2KPUME52RNo3jb6+GgPOi88VWrtP6cSN9YMEMoDfv+\nfCpwlcprQMkI7/n5maY=\n-----END PUBLIC KEY-----',
          privateKey:
            '-----BEGIN EC PRIVATE KEY-----\nMIHcAgEBBEIBNEpETeR/TpDr0aVMUVcgGmOBQBsX3NC2mRCSa61QolLHkgVAFwkF\nLiQgdxcOsXuRho9CJuHdE8vP3TVFqeP/kAqgBwYFK4EEACOhgYkDgYYABAECej+J\nJmHzwQSiJV6fD+WF+biSTr+LwxW9XQ1bWuj/AtdjXfHXWYHbE/MrnVb8QNRuTUcw\noItprSePixLE6zj6KwAsj9xaMJKol0384tYSyXpKvGQF7Yo9QwTnZE2jeNvr4aA8\n6LzxVau0/pxI31gwQygN+/58KnCVymtAyQjv+fmZpg==\n-----END EC PRIVATE KEY-----',
          signOptions: { algorithm: 'ES512' },
          verifyOptions: { algorithms: ['ES512'] },
        }),
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    service = new AccountService(accountRepository, jwtRepository, jwtService);
  });

  describe('register', () => {
    const param: Register = {
      email: 'test@bunnychess.com',
      username: 'username',
      password: 'password',
      isAdmin: false,
    };

    it('should store a new account in the repository', async () => {
      jest
        .spyOn(accountRepository, 'insertAccount')
        .mockResolvedValue({ id: 'id', username: param.username } as Account);

      await service.register(param);

      expect(accountRepository.insertAccount).toHaveBeenCalledWith(param);
    });

    it('should return newly created account', async () => {
      const insertAccountResult = { ...param };
      jest
        .spyOn(accountRepository, 'insertAccount')
        .mockResolvedValue(insertAccountResult as Account);

      expect(service.register(param)).resolves.toBe(insertAccountResult);
    });
  });

  describe('login', () => {
    const param: Login = {
      email: 'test@bunnychess.com',
      password: 'password',
    };
    const findAccountResult: Account = {
      id: 'id',
      email: param.email,
      username: 'username',
      password: '$2a$10$88Dk9kCgYm4U4JNhsBDxrOT4AK2.cGRa3l/SloeRIbVSfhF3kkrXW',
      isAdmin: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    beforeEach(() => {
      jest.useFakeTimers({ now, doNotFake: ['nextTick'] });
      jest.spyOn(accountRepository, 'findAccount').mockResolvedValue(findAccountResult);
      jest
        .spyOn(accountRepository, 'updateAccount')
        .mockImplementation(jest.fn<any, any>(() => ({ catch: jest.fn() })));
    });

    it('should throw an email not found exception if no account with provided email is found', async () => {
      jest.spyOn(accountRepository, 'findAccount').mockResolvedValue(undefined);

      expect(service.login(param)).rejects.toThrow(EmailNotFoundException);
    });

    it('should throw a wrong password exception if password is incorrect', async () => {
      expect(service.login({ ...param, password: 'wrong' })).rejects.toThrow(
        WrongPasswordException,
      );
    });

    it('should update account last login date', async () => {
      const updateAccountSpy = jest.spyOn(accountRepository, 'updateAccount');

      await service.login(param);

      expect(updateAccountSpy).toHaveBeenCalledWith(findAccountResult.id, {
        lastLoginAt: now,
      });
    });

    it('should return valid jwt token based on account data found in the database', async () => {
      const { email, isAdmin, username, id: accountId } = findAccountResult;

      const { jwt } = await service.login(param);

      expect(jwtService.verifyAsync(jwt)).resolves.toEqual({
        email,
        isAdmin,
        username,
        accountId,
        exp: expect.any(Number),
        iat: expect.any(Number),
      });
    });

    it('should set correct jwt token expiration time', async () => {
      const expiration = new Date(now.getTime() + env.jwtExpireAfterMs);

      const { jwt, jwtExpires } = await service.login(param);

      expect(jwtService.verifyAsync(jwt)).resolves.toMatchObject({
        exp: expiration.getTime() / 1000,
      });
      expect(jwtExpires).toEqual(expiration);
    });

    it('should return valid jwt refresh token', async () => {
      const { id: accountId } = findAccountResult;

      const { jwtRefresh } = await service.login(param);

      expect(jwtService.verifyAsync(jwtRefresh)).resolves.toEqual({
        jti: expect.any(String),
        accountId,
        exp: expect.any(Number),
        iat: expect.any(Number),
      });
    });

    it('should set correct jwt refresh token expiration time', async () => {
      const expiration = new Date(now.getTime() + env.jwtRefreshExpireAfterMs);

      const { jwtRefresh, jwtRefreshExpires } = await service.login(param);

      expect(jwtService.verifyAsync(jwtRefresh)).resolves.toMatchObject({
        exp: expiration.getTime() / 1000,
      });
      expect(jwtRefreshExpires).toEqual(expiration);
    });
  });

  describe('refresh', () => {
    const param: Login = {
      email: 'test@bunnychess.com',
      password: 'password',
    };

    beforeEach(() => {
      jest.spyOn(accountRepository, 'findAccount').mockResolvedValue({
        id: 'id',
        email: param.email,
        username: 'username',
        password: '$2a$10$88Dk9kCgYm4U4JNhsBDxrOT4AK2.cGRa3l/SloeRIbVSfhF3kkrXW',
        isAdmin: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      jest
        .spyOn(accountRepository, 'updateAccount')
        .mockImplementation(jest.fn<any, any>(() => ({ catch: jest.fn() })));
      jest.spyOn(jwtRepository, 'deleteJwtRefresh').mockResolvedValue(true);
    });

    it('should throw an exception if provided refresh token is invalid', async () => {
      expect(service.refresh('invalid_jwt_refresh_token')).rejects.toThrow(
        InvalidJwtRefreshException,
      );
    });

    it('should delete the refresh token stored in the repository', async () => {
      const deleteJwtRefreshSpy = jest.spyOn(jwtRepository, 'deleteJwtRefresh');

      const { jwtRefresh } = await service.login(param);
      const { accountId, jti } = await jwtService.verifyAsync(jwtRefresh);
      await service.refresh(jwtRefresh);

      expect(deleteJwtRefreshSpy).toHaveBeenCalledWith(accountId, jti);
    });

    it('should throw an exception if provided refresh token is not found in repository', async () => {
      jest.spyOn(jwtRepository, 'deleteJwtRefresh').mockResolvedValue(false);

      const { jwtRefresh } = await service.login(param);

      expect(service.refresh(jwtRefresh)).rejects.toThrow(JwtRefreshNotFoundException);
    });

    it('should return newly generated jwt and jwt refresh tokens', async () => {
      const { jwtRefresh } = await service.login(param);

      const result = await service.refresh(jwtRefresh);

      expect(result).toEqual({
        jwt: expect.any(String),
        jwtExpires: expect.any(Date),
        jwtRefresh: expect.any(String),
        jwtRefreshExpires: expect.any(Date),
      });
      expect(result.jwtRefresh).not.toEqual(jwtRefresh);
    });
  });
});
