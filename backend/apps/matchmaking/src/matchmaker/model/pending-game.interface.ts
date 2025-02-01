import { GameType } from '@common/game/model/game-type';

export interface PendingGame {
  readyPlayersCount: number;
  gameType: GameType;
  ranked: boolean;
  accountIds: string[];
}
