import type { Chess } from 'chess.js';
import { shuffle } from 'lodash';
import { ChessAi, type AiSkillLevel } from './ai';

/**
 * Game state snapshot received from server.
 */
export interface Game {
  id: string;
  pgn: string;
  gameType: string;
  accountIds: {
    w: string;
    b: string;
  };
  metadata: string;
  gameRules: {
    timeLimitMs: number;
    timeIncreasePerTurnMs: number;
  };
  gameClocks: {
    w: number;
    b: number;
    startTimestamp: number;
    lastMoveTimestamp: number;
  };
  resignedColor?: 'w' | 'b' | undefined;
  seq: number;
  vsAi: AiSkillLevel | undefined;
}

/**
 * Game metadata parsed JSON structure.
 */
export interface GameMetadata {
  mmr0: number;
  mmr1: number;
  ranked: boolean;
}

/**
 * Convert JSON string to Game data structure.
 *
 * @param gameString stringified Game
 * @returns Game
 */
export function gameFromString(gameString: string): Game {
  return JSON.parse(gameString);
}

/**
 * Create a local game against AI, returning a Game data structure ready to be joined.
 *
 * @param param game creation parameters
 * @returns Game
 */
export function createGameAgainstAi({
  gameType,
  skillLevel,
  accountId
}: {
  gameType: string;
  skillLevel: AiSkillLevel;
  accountId: string;
}): Game {
  const [w, b] = shuffle([accountId, ChessAi.id]);
  const [limit, increase] = gameType.split('+').map(Number);
  const timeLimitMs = limit * 60 * 1000;
  const timeIncreasePerTurnMs = increase * 1000;
  return {
    id: 'local_game',
    pgn: '',
    gameType,
    accountIds: { w, b },
    metadata: '{}',
    gameRules: { timeLimitMs, timeIncreasePerTurnMs },
    gameClocks: {
      w: timeLimitMs,
      b: timeLimitMs,
      startTimestamp: Date.now(),
      lastMoveTimestamp: Date.now()
    },
    seq: 0,
    vsAi: skillLevel
  };
}

export const MAX_MOVES = 300;

export enum GameOverReason {
  Checkmate = 'checkmate',
  Stalemate = 'stalemate',
  FiftyMovesRule = 'fifty_moves_rule',
  ThreefoldRepetition = 'threefold_repetition',
  InsufficientMaterial = 'insufficient_material',
  WhiteTimeout = 'white_timeout',
  BlackTimeout = 'black_timeout',
  Resignation = 'resignation',
  MaxMoves = 'max_moves'
}

/**
 * Return game over reason code or undefined if game has not ended yet.
 * Useful for local games against AI; for online games, the server will send the game over reason.
 *
 * @param chess Chess.js instance
 * @returns game over reason code or undefined if game has not ended yet
 */
export function checkGameOver(chess: Chess): string | undefined {
  if (chess.isCheckmate()) {
    return GameOverReason.Checkmate;
  }
  if (chess.history().length >= MAX_MOVES) {
    return GameOverReason.MaxMoves;
  }
  if (chess.isDraw()) {
    if (chess.isStalemate()) {
      return GameOverReason.Stalemate;
    }
    if (chess.isInsufficientMaterial()) {
      return GameOverReason.InsufficientMaterial;
    }
    if (chess.isThreefoldRepetition()) {
      return GameOverReason.ThreefoldRepetition;
    }
    return GameOverReason.FiftyMovesRule;
  }
  return undefined;
}

/**
 * Return human readable game over reason based on game over reason code from server.
 *
 * @param gameOverReasonCode game over reason code
 * @returns human readable game over reason
 */
export function getPrettyGameOverReason(gameOverReasonCode: string): string | undefined {
  const gameOverReasonMapping: Record<string, string> = {
    [GameOverReason.Checkmate]: 'checkmate',
    [GameOverReason.Stalemate]: 'stalemate',
    [GameOverReason.FiftyMovesRule]: 'fifty moves rule',
    [GameOverReason.ThreefoldRepetition]: 'threefold repetition',
    [GameOverReason.InsufficientMaterial]: 'insufficient material',
    [GameOverReason.WhiteTimeout]: 'white timeout',
    [GameOverReason.BlackTimeout]: 'black timeout',
    [GameOverReason.Resignation]: 'resignation',
    [GameOverReason.MaxMoves]: 'max moves'
  };
  return gameOverReasonMapping[gameOverReasonCode];
}
