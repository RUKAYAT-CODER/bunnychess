import { GameOverEvent } from '@common/game/stream/game-over.event';
import { GameStartEvent } from '@common/game/stream/game-start.event';
import { GameStateUpdateEvent } from '@common/game/stream/game-state-update.event';
import { GameSubject } from '@common/game/stream/game.subject';
import { Injectable } from '@nestjs/common';
import { NatsJetStreamClientProxy } from '@pietrobassi/nestjs-nats-jetstream-transport';

@Injectable()
export class StreamService {
  constructor(private readonly client: NatsJetStreamClientProxy) {}

  async emitGameStart(payload: GameStartEvent): Promise<void> {
    await this.client.emit(GameSubject.GameStart, payload).subscribe();
  }

  async emitGameStateUpdate(payload: GameStateUpdateEvent): Promise<void> {
    await this.client.emit(GameSubject.GameStateUpdate, payload).subscribe();
  }

  async emitGameOver(payload: GameOverEvent): Promise<void> {
    await this.client.emit(GameSubject.GameOver, payload).subscribe();
  }
}
