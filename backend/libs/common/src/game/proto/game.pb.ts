/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export const protobufPackage = "game";

export interface CreateGameRequestPb {
  accountId0: string;
  accountId1: string;
  gameType: string;
  metadata: string;
}

export interface CreateGameResponsePb {
  gameId: string;
  gameRepr: string;
}

export interface MakeMoveRequestPb {
  accountId: string;
  gameId: string;
  move: string;
}

export interface MakeMoveResponsePb {
  gameRepr: string;
}

export interface GetGameStateRequestPb {
  gameId: string;
}

export interface GetGameStateResponsePb {
  gameRepr: string;
}

export interface CheckGameResultRequestPb {
  gameId: string;
}

export interface CheckGameResultResponsePb {
}

export interface ResignRequestPb {
  accountId: string;
  gameId: string;
}

export interface ResignResponsePb {
  gameRepr: string;
}

export const GAME_PACKAGE_NAME = "game";

export interface GameServiceClient {
  createGame(request: CreateGameRequestPb, metadata?: Metadata): Observable<CreateGameResponsePb>;

  getGameState(request: GetGameStateRequestPb, metadata?: Metadata): Observable<GetGameStateResponsePb>;

  checkGameResult(request: CheckGameResultRequestPb, metadata?: Metadata): Observable<CheckGameResultResponsePb>;

  makeMove(request: MakeMoveRequestPb, metadata?: Metadata): Observable<MakeMoveResponsePb>;

  resign(request: ResignRequestPb, metadata?: Metadata): Observable<ResignResponsePb>;
}

export interface GameServiceController {
  createGame(
    request: CreateGameRequestPb,
    metadata?: Metadata,
  ): Promise<CreateGameResponsePb> | Observable<CreateGameResponsePb> | CreateGameResponsePb;

  getGameState(
    request: GetGameStateRequestPb,
    metadata?: Metadata,
  ): Promise<GetGameStateResponsePb> | Observable<GetGameStateResponsePb> | GetGameStateResponsePb;

  checkGameResult(
    request: CheckGameResultRequestPb,
    metadata?: Metadata,
  ): Promise<CheckGameResultResponsePb> | Observable<CheckGameResultResponsePb> | CheckGameResultResponsePb;

  makeMove(
    request: MakeMoveRequestPb,
    metadata?: Metadata,
  ): Promise<MakeMoveResponsePb> | Observable<MakeMoveResponsePb> | MakeMoveResponsePb;

  resign(
    request: ResignRequestPb,
    metadata?: Metadata,
  ): Promise<ResignResponsePb> | Observable<ResignResponsePb> | ResignResponsePb;
}

export const GAME_SERVICE_NAME = "GameService";
