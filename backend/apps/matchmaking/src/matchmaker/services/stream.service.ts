import { MatchmakingSubject } from '@common/matchmaking/stream/matchmaking.subject';
import { PendingGameReadyEvent } from '@common/matchmaking/stream/pending-game-ready.event';
import { PendingGameTimeoutEvent } from '@common/matchmaking/stream/pending-game-timeout.event';
import { Injectable } from '@nestjs/common';
import { NatsJetStreamClientProxy } from '@pietrobassi/nestjs-nats-jetstream-transport';

@Injectable()
export class StreamService {
  constructor(private readonly client: NatsJetStreamClientProxy) {}

  async emitPendingGameReady(payload: PendingGameReadyEvent) {
    await this.client.emit(MatchmakingSubject.PendingGameReady, payload).subscribe();
  }

  async emitPendingGameTimeout(payload: PendingGameTimeoutEvent) {
    await this.client.emit(MatchmakingSubject.PendingGameTimeout, payload).subscribe();
  }
}
