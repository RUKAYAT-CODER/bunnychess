import {
  AcceptPendingGameRequestPb,
  AcceptPendingGameResponsePb,
  AddToQueueRequestPb,
  AddToQueueResponsePb,
  GetAccountStatusRequestPb,
  GetAccountStatusResponsePb,
  GetQueueSizesRequestPb,
  GetQueueSizesResponsePb,
  MATCHMAKER_PACKAGE_NAME,
  MATCHMAKER_SERVICE_NAME,
  MatchmakerServiceClient,
  RemoveFromQueueRequestPb,
  RemoveFromQueueResponsePb,
} from '@common/matchmaking/proto/matchmaker.pb';
import {
  GetAccountRankingRequestPb,
  GetAccountRankingResponsePb,
  RANKING_PACKAGE_NAME,
  RANKING_SERVICE_NAME,
  RankingServiceClient,
} from '@common/matchmaking/proto/ranking.pb';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { NOTIFY_QUEUE_SIZES, NotifyQueueSizesJob } from './job/notify-queue-sizes.queue';
import { QueueSizesRepositoryService } from './queue-sizes.repository.service';

export interface QueueSizes {
  [key: string]: { normal: number; ranked: number };
}

@Injectable()
export class MatchmakingService implements OnModuleInit {
  private grpcMatchmakerService: MatchmakerServiceClient;
  private grpcRankingService: RankingServiceClient;

  private readonly NOTIFY_QUEUE_SIZES_INTERVAL_MS: number = 1500;

  constructor(
    @InjectQueue(NOTIFY_QUEUE_SIZES) private notifyQueueSizesQueue: Queue,
    @Inject(MATCHMAKER_PACKAGE_NAME) private readonly matchmakerClient: ClientGrpc,
    @Inject(RANKING_PACKAGE_NAME) private readonly rankingClient: ClientGrpc,
    private readonly queueSizesRepository: QueueSizesRepositoryService,
  ) {}

  onModuleInit(): void {
    this.grpcMatchmakerService =
      this.matchmakerClient.getService<MatchmakerServiceClient>(MATCHMAKER_SERVICE_NAME);
    this.grpcRankingService =
      this.rankingClient.getService<RankingServiceClient>(RANKING_SERVICE_NAME);

    this.initQueues();
  }

  async addToQueue(addToQueueRequest: AddToQueueRequestPb): Promise<AddToQueueResponsePb> {
    return firstValueFrom(this.grpcMatchmakerService.addToQueue(addToQueueRequest));
  }

  async acceptPendingGame(
    acceptPendingGameRequest: AcceptPendingGameRequestPb,
  ): Promise<AcceptPendingGameResponsePb> {
    return firstValueFrom(this.grpcMatchmakerService.acceptPendingGame(acceptPendingGameRequest));
  }

  async removeFromQueue(
    removeFromQueueRequest: RemoveFromQueueRequestPb,
  ): Promise<RemoveFromQueueResponsePb> {
    return firstValueFrom(this.grpcMatchmakerService.removeFromQueue(removeFromQueueRequest));
  }

  async getAccountStatus(
    getAccountStatusRequest: GetAccountStatusRequestPb,
  ): Promise<GetAccountStatusResponsePb> {
    return firstValueFrom(this.grpcMatchmakerService.getAccountStatus(getAccountStatusRequest));
  }

  async getQueueSizes(
    getQueueSizesRequest: GetQueueSizesRequestPb,
  ): Promise<GetQueueSizesResponsePb> {
    return firstValueFrom(this.grpcMatchmakerService.getQueueSizes(getQueueSizesRequest));
  }

  async getCachedQueueSizes(): Promise<QueueSizes | undefined> {
    return this.queueSizesRepository.getQueueSizes();
  }

  async getAccountRanking(
    getAccountRankingRequest: GetAccountRankingRequestPb,
  ): Promise<GetAccountRankingResponsePb> {
    return firstValueFrom(this.grpcRankingService.getAccountRanking(getAccountRankingRequest));
  }

  private async initQueues(): Promise<void> {
    const repeatable = await this.notifyQueueSizesQueue.getRepeatableJobs();
    await Promise.all(
      repeatable.map((job) => this.notifyQueueSizesQueue.removeRepeatableByKey(job.key)),
    );
    await this.notifyQueueSizesQueue.add(NotifyQueueSizesJob.NotifyQueueSizes, null, {
      jobId: 'job_notify_queue_sizes',
      repeat: {
        every: this.NOTIFY_QUEUE_SIZES_INTERVAL_MS,
      },
    });
  }
}
