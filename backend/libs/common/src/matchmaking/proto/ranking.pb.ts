/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export const protobufPackage = "ranking";

export interface GetAccountRankingRequestPb {
  accountId: string;
}

export interface GetAccountRankingResponsePb {
  rankedMmr: number;
  normalMmr: number;
}

export const RANKING_PACKAGE_NAME = "ranking";

export interface RankingServiceClient {
  getAccountRanking(request: GetAccountRankingRequestPb, metadata?: Metadata): Observable<GetAccountRankingResponsePb>;
}

export interface RankingServiceController {
  getAccountRanking(
    request: GetAccountRankingRequestPb,
    metadata?: Metadata,
  ): Promise<GetAccountRankingResponsePb> | Observable<GetAccountRankingResponsePb> | GetAccountRankingResponsePb;
}

export const RANKING_SERVICE_NAME = "RankingService";
