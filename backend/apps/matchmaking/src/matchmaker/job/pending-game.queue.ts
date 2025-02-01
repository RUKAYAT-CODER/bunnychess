export const PENDING_GAME_QUEUE = 'pending_game_queue';

export enum PendingGameJob {
  Timeout = 'timeout',
}

export interface TimeoutPayload {
  pendingGameId: string;
  accountId0: string;
  accountId1: string;
}
