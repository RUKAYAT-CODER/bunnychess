import { EloChangeEvent } from '@common/matchmaking/stream/elo-change.event';
import { MatchmakingSubject } from '@common/matchmaking/stream/matchmaking.subject';
import { Injectable } from '@nestjs/common';
import { NatsJetStreamClientProxy } from '@pietrobassi/nestjs-nats-jetstream-transport';

@Injectable()
export class StreamService {
  constructor(private readonly client: NatsJetStreamClientProxy) {}

  async emitEloChange(payload: EloChangeEvent): Promise<void> {
    await this.client.emit(MatchmakingSubject.EloChange, payload).subscribe();
  }
}
