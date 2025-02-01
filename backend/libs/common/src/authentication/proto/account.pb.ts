/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export const protobufPackage = "account";

export interface AccountPb {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date | undefined | null;
  lastLoginAt?: Date | undefined | null;
}

export interface RegisterRequestPb {
  email: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface LoginRequestPb {
  email: string;
  password: string;
}

export interface LoginResponsePb {
  jwt: string;
  jwtExpires: Date | undefined | null;
  jwtRefresh: string;
  jwtRefreshExpires: Date | undefined | null;
}

export interface RefreshRequestPb {
  jwtRefresh: string;
}

export interface FindAccountRequestPb {
  id?: string | undefined | null;
  email?: string | undefined | null;
}

export const ACCOUNT_PACKAGE_NAME = "account";

export interface AccountServiceClient {
  register(request: RegisterRequestPb, metadata?: Metadata): Observable<AccountPb>;

  login(request: LoginRequestPb, metadata?: Metadata): Observable<LoginResponsePb>;

  refresh(request: RefreshRequestPb, metadata?: Metadata): Observable<LoginResponsePb>;

  findAccount(request: FindAccountRequestPb, metadata?: Metadata): Observable<AccountPb>;
}

export interface AccountServiceController {
  register(request: RegisterRequestPb, metadata?: Metadata): Promise<AccountPb> | Observable<AccountPb> | AccountPb;

  login(
    request: LoginRequestPb,
    metadata?: Metadata,
  ): Promise<LoginResponsePb> | Observable<LoginResponsePb> | LoginResponsePb;

  refresh(
    request: RefreshRequestPb,
    metadata?: Metadata,
  ): Promise<LoginResponsePb> | Observable<LoginResponsePb> | LoginResponsePb;

  findAccount(
    request: FindAccountRequestPb,
    metadata?: Metadata,
  ): Promise<AccountPb> | Observable<AccountPb> | AccountPb;
}

export const ACCOUNT_SERVICE_NAME = "AccountService";
