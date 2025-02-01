import { Chess, Color, Move } from 'chess.js';
import { randomUUID } from 'crypto';
import { GameOverException } from '../exceptions/game-over.exception';
import { InvalidMoveException } from '../exceptions/invalid-move.exception';
import { TurnException } from '../exceptions/turn.exception';
import { UnknownAccountIdException } from '../exceptions/unknown-account-id.exception';

export interface AccountIds {
  w: string;
  b: string;
}

export interface GameRules {
  timeLimitMs: number;
  timeIncreasePerTurnMs: number;
}

export interface GameClocks {
  w: number;
  b: number;
  startTimestamp: number;
  lastMoveTimestamp?: number;
}

export enum GameOverReason {
  Checkmate = 'checkmate',
  Stalemate = 'stalemate',
  FiftyMovesRule = 'fifty_moves_rule',
  ThreefoldRepetition = 'threefold_repetition',
  InsufficientMaterial = 'insufficient_material',
  WhiteTimeout = 'white_timeout',
  BlackTimeout = 'black_timeout',
  Resignation = 'resignation',
  MaxMoves = 'max_moves',
}

export interface GameResult {
  outcome: 'w' | 'b' | 'draw';
  winnerAccountId?: string;
  reason: GameOverReason;
}

export interface JsonRepr {
  id: string;
  pgn: string;
  gameType: string;
  accountIds: AccountIds;
  metadata: string;
  gameRules: GameRules;
  gameClocks: GameClocks;
  resignedColor?: Color | undefined;
  seq: number;
}

export const MAX_MOVES = 300;

/**
 * Object that represents a chess game.
 * Wraps chess.js library, enriching it with metadata and clocks.
 */
export class ChessGame {
  private _id: string;
  private _chess: Chess;
  private _gameType: string;
  private _accountIds: AccountIds;
  private _metadata: string;
  private _gameRules: GameRules;
  private _gameClocks: GameClocks;
  private _resignedColor?: Color | undefined;

  static fromScratch(gameConfig: {
    gameType: string;
    accountIds: AccountIds;
    metadata: string;
    gameRules: GameRules;
  }): ChessGame {
    return new ChessGame(gameConfig);
  }

  static fromString(gameString: string): ChessGame {
    const gameRepr: JsonRepr = JSON.parse(gameString);
    return new ChessGame(gameRepr);
  }

  toString(): string {
    // Always update the clocks before serializing the game
    this.updateClock();

    const jsonRepr: JsonRepr = {
      id: this._id,
      pgn: this._chess.pgn(),
      gameType: this._gameType,
      accountIds: this._accountIds,
      metadata: this._metadata,
      gameRules: this._gameRules,
      gameClocks: this._gameClocks,
      resignedColor: this._resignedColor,
      seq: this.seq,
    };
    return JSON.stringify(jsonRepr);
  }

  move(accountId: string, move: string): Move {
    const now = this.updateClock();
    const turn = this._chess.turn();

    if (this.isGameOver()) {
      throw new GameOverException(this._id);
    }
    if (accountId !== this._accountIds[turn]) {
      throw new TurnException(`Not ${accountId} turn`);
    }

    let moveDetails;
    try {
      moveDetails = this._chess.move(move);
      this._gameClocks[turn] += this._gameRules.timeIncreasePerTurnMs;
      this._gameClocks.lastMoveTimestamp = now;
    } catch (_err) {
      throw new InvalidMoveException(`Invalid move ${move} by ${accountId}`);
    }
    return moveDetails;
  }

  resign(accountId: string): void {
    if (this.isGameOver()) {
      throw new GameOverException(this._id);
    }
    if (![this._accountIds.w, this._accountIds.b].includes(accountId)) {
      throw new UnknownAccountIdException();
    }
    this._resignedColor = this._accountIds.w === accountId ? 'w' : 'b';
  }

  checkGameResult(): GameResult | undefined {
    const turnColor = this._chess.turn();
    this.updateClock();

    if (this._chess.isCheckmate()) {
      const winnerColor = this.getOtherColor(turnColor);
      return {
        winnerAccountId: this._accountIds[winnerColor],
        outcome: winnerColor,
        reason: GameOverReason.Checkmate,
      };
    }

    if (this._resignedColor) {
      const winnerColor = this.getOtherColor(this._resignedColor);
      return {
        winnerAccountId: this._accountIds[winnerColor],
        outcome: winnerColor,
        reason: GameOverReason.Resignation,
      };
    }

    if (this._chess.history().length >= MAX_MOVES) {
      return { outcome: 'draw', reason: GameOverReason.MaxMoves };
    }

    if (this._chess.isDraw()) {
      const drawResult: Omit<GameResult, 'reason'> = { outcome: 'draw' };

      if (this._chess.isStalemate()) {
        return { ...drawResult, reason: GameOverReason.Stalemate };
      }
      if (this._chess.isInsufficientMaterial()) {
        return { ...drawResult, reason: GameOverReason.InsufficientMaterial };
      }
      if (this._chess.isThreefoldRepetition()) {
        return { ...drawResult, reason: GameOverReason.ThreefoldRepetition };
      }
      // Only other possible draw reason is fifty moves rule
      return { ...drawResult, reason: GameOverReason.FiftyMovesRule };
    }

    // Clock timeout (must be the last check)
    if (this._gameClocks[turnColor] === 0) {
      const winnerColor = this.getOtherColor(turnColor);
      return {
        winnerAccountId: this._accountIds[winnerColor],
        outcome: winnerColor,
        reason: turnColor === 'w' ? GameOverReason.WhiteTimeout : GameOverReason.BlackTimeout,
      };
    }

    return undefined;
  }

  isGameOver(): boolean {
    return (
      this._chess.isGameOver() ||
      this._gameClocks.w === 0 ||
      this._gameClocks.b === 0 ||
      this._chess.history().length >= MAX_MOVES ||
      !!this._resignedColor
    );
  }

  get moves(): string[] {
    return this._chess.moves();
  }

  get turn(): Color {
    return this._chess.turn();
  }

  get id(): string {
    return this._id;
  }

  get gameType(): string {
    return this._gameType;
  }

  get accountIds(): AccountIds {
    return { ...this._accountIds };
  }

  get metadata(): string {
    return this._metadata;
  }

  get gameRules(): GameRules {
    return { ...this._gameRules };
  }

  get gameClocks(): GameClocks {
    this.updateClock();
    return { ...this._gameClocks };
  }

  get resignedColor(): Color | undefined {
    return this._resignedColor;
  }

  get fen(): string {
    return this._chess.fen();
  }

  get pgn(): string {
    return this._chess.pgn();
  }

  get history(): string[] {
    return this._chess.history();
  }

  get seq(): number {
    // Resignation counts as a move for sequence calculation
    return this._chess.history().length + Number(!!this._resignedColor);
  }

  private constructor(game: {
    id?: string;
    pgn?: string;
    gameType: string;
    accountIds: AccountIds;
    metadata: string;
    gameRules: GameRules;
    gameClocks?: GameClocks;
    resignedColor?: Color | undefined;
  }) {
    this._id = game.id ?? randomUUID();
    this._gameType = game.gameType;
    this._chess = new Chess();
    if (game.pgn) {
      this._chess.loadPgn(game.pgn);
    }
    this._accountIds = game.accountIds;
    this._metadata = game.metadata;
    this._gameRules = game.gameRules;
    this._gameClocks = game.gameClocks ?? {
      b: this._gameRules.timeLimitMs,
      w: this._gameRules.timeLimitMs,
      startTimestamp: Date.now(),
    };
    this._resignedColor = game.resignedColor;
  }

  private getOtherColor(color: Color): Color {
    return color === 'w' ? 'b' : 'w';
  }

  private updateClock(): number {
    const now = Date.now();
    const turnColor = this._chess.turn();
    this._gameClocks[turnColor] = Math.max(
      0,
      this._gameClocks[turnColor] -
        (now - (this._gameClocks.lastMoveTimestamp ?? this._gameClocks.startTimestamp)),
    );
    return now;
  }
}
