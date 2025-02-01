import { NatsStreamConfig } from '@pietrobassi/nestjs-nats-jetstream-transport';
import { RetentionPolicy, StorageType, nanos } from 'nats';

/**
 * Configuration for the JetStream streams used in the application.
 *
 * Ideally, stream creation should be done in a more controlled way (e.g. DevOps).
 */
export const streamConfig: NatsStreamConfig[] = [
  {
    name: 'game',
    retention: RetentionPolicy.Limits,
    storage: StorageType.Memory,
    subjects: ['bunnychess.game.game-start', 'bunnychess.game.game-state-update'],
    max_age: nanos(10 * 1000), // 10 seconds
  },
  {
    // game-result messages must be persistent since they are important for calculating new Elo ratings.
    // Doing so - in case of an outage of Matchmaking microservice - the service can resume and process
    // all pending game-over messages.
    name: 'game-result',
    storage: StorageType.File,
    subjects: ['bunnychess.game.game-over'],
  },
  {
    name: 'matchmaking',
    retention: RetentionPolicy.Limits,
    storage: StorageType.Memory,
    subjects: ['bunnychess.matchmaking.*'],
    max_age: nanos(10 * 1000), // 10 seconds
  },
];
