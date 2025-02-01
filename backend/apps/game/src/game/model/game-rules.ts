import { GameType } from '@common/game/model/game-type';
import ms from 'ms';
import { GameRules } from './chess-game';

export const GAME_RULES: Record<GameType, GameRules> = {
  [GameType.Rapid_10_0]: {
    timeLimitMs: ms('10m'),
    timeIncreasePerTurnMs: 0,
  },
  [GameType.Blitz_5_3]: {
    timeLimitMs: ms('5m'),
    timeIncreasePerTurnMs: ms('3s'),
  },
  [GameType.Blitz_5_0]: {
    timeLimitMs: ms('5m'),
    timeIncreasePerTurnMs: 0,
  },
  [GameType.Blitz_3_2]: {
    timeLimitMs: ms('3m'),
    timeIncreasePerTurnMs: ms('2s'),
  },
  [GameType.Blitz_3_0]: {
    timeLimitMs: ms('3m'),
    timeIncreasePerTurnMs: 0,
  },
  [GameType.Bullet_1_0]: {
    timeLimitMs: ms('1m'),
    timeIncreasePerTurnMs: 0,
  },
};
