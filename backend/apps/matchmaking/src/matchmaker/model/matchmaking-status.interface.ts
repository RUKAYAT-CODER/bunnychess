import { GameType } from '@common/game/model/game-type';
import { PlayerStatus } from './player-status.enum';

export interface MatchmakingStatus {
  status: PlayerStatus;
  gameType?: GameType | undefined;
  ranked?: boolean | undefined;
  gameId?: string | undefined;
}
