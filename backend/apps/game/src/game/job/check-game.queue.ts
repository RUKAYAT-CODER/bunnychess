export const CHECK_GAME_QUEUE = 'check_game_queue';

export enum CheckGameJob {
  CheckGame = 'check_game',
}

export interface CheckGamePayload {
  gameId: string;
}
