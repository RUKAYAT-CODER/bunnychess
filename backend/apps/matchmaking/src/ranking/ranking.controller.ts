import {
  GetAccountRankingRequestPb,
  GetAccountRankingResponsePb,
  RANKING_SERVICE_NAME,
  RankingServiceController,
} from '@common/matchmaking/proto/ranking.pb';
import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { RankingService } from './services/ranking.service';

@Controller()
export class RankingController implements RankingServiceController {
  constructor(private readonly rankingService: RankingService) {}

  @GrpcMethod(RANKING_SERVICE_NAME, 'getAccountRanking')
  async getAccountRanking(
    request: GetAccountRankingRequestPb,
  ): Promise<GetAccountRankingResponsePb> {
    const ranking = await this.rankingService.getRankingOrDefault(request.accountId);
    if (!ranking) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Ranking not found',
      });
    }
    return { rankedMmr: ranking.rankedMmr, normalMmr: ranking.normalMmr };
  }
}
