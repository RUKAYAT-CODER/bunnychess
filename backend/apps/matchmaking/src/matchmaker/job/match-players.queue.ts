import { GameType } from '@common/game/model/game-type';

export const MATCH_PLAYERS_QUEUE = 'match_players_queue';

export enum MatchPlayersJob {
  CheckQueue = 'check_queue',
}

export interface MatchPlayersPayload {
  gameType: GameType;
  ranked: boolean;
}
