/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export const protobufPackage = "matchmaker";

export interface AddToQueueRequestPb {
  accountId: string;
  gameType: string;
  ranked: boolean;
}

export interface AddToQueueResponsePb {
}

export interface RemoveFromQueueRequestPb {
  accountId: string;
}

export interface RemoveFromQueueResponsePb {
}

export interface GetAccountStatusRequestPb {
  accountId: string;
}

export interface GetAccountStatusResponsePb {
  status: string;
  gameType?: string | undefined | null;
  ranked?: boolean | undefined | null;
  gameId?: string | undefined | null;
}

export interface AcceptPendingGameRequestPb {
  accountId: string;
  pendingGameId: string;
}

export interface AcceptPendingGameResponsePb {
}

export interface GetQueueSizesRequestPb {
}

export interface QueueSizePb {
  normal: number;
  ranked: number;
}

export interface GetQueueSizesResponsePb {
  queueSizes: { [key: string]: QueueSizePb };
}

export interface GetQueueSizesResponsePb_QueueSizesEntryPb {
  key: string;
  value: QueueSizePb | undefined | null;
}

export const MATCHMAKER_PACKAGE_NAME = "matchmaker";

export interface MatchmakerServiceClient {
  addToQueue(request: AddToQueueRequestPb, metadata?: Metadata): Observable<AddToQueueResponsePb>;

  acceptPendingGame(request: AcceptPendingGameRequestPb, metadata?: Metadata): Observable<AcceptPendingGameResponsePb>;

  removeFromQueue(request: RemoveFromQueueRequestPb, metadata?: Metadata): Observable<RemoveFromQueueResponsePb>;

  getAccountStatus(request: GetAccountStatusRequestPb, metadata?: Metadata): Observable<GetAccountStatusResponsePb>;

  getQueueSizes(request: GetQueueSizesRequestPb, metadata?: Metadata): Observable<GetQueueSizesResponsePb>;
}

export interface MatchmakerServiceController {
  addToQueue(
    request: AddToQueueRequestPb,
    metadata?: Metadata,
  ): Promise<AddToQueueResponsePb> | Observable<AddToQueueResponsePb> | AddToQueueResponsePb;

  acceptPendingGame(
    request: AcceptPendingGameRequestPb,
    metadata?: Metadata,
  ): Promise<AcceptPendingGameResponsePb> | Observable<AcceptPendingGameResponsePb> | AcceptPendingGameResponsePb;

  removeFromQueue(
    request: RemoveFromQueueRequestPb,
    metadata?: Metadata,
  ): Promise<RemoveFromQueueResponsePb> | Observable<RemoveFromQueueResponsePb> | RemoveFromQueueResponsePb;

  getAccountStatus(
    request: GetAccountStatusRequestPb,
    metadata?: Metadata,
  ): Promise<GetAccountStatusResponsePb> | Observable<GetAccountStatusResponsePb> | GetAccountStatusResponsePb;

  getQueueSizes(
    request: GetQueueSizesRequestPb,
    metadata?: Metadata,
  ): Promise<GetQueueSizesResponsePb> | Observable<GetQueueSizesResponsePb> | GetQueueSizesResponsePb;
}

export const MATCHMAKER_SERVICE_NAME = "MatchmakerService";
