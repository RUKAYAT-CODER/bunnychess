import type { PieceSymbol, Square } from 'chess.js';
import { random } from 'lodash';

export enum AiSkillLevel {
  VeryEasy = 'very_easy',
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  VeryHard = 'very_hard'
}

const AI_SETTINGS: Record<
  AiSkillLevel,
  {
    aiUsername: string;
    depth: number;
    skillLevelValue: number;
    thinkingTimeLimitsMs: [number, number];
  }
> = {
  [AiSkillLevel.VeryEasy]: {
    aiUsername: 'Beginner Bunnybot',
    skillLevelValue: 0,
    depth: 1,
    thinkingTimeLimitsMs: [800, 6000]
  },
  [AiSkillLevel.Easy]: {
    aiUsername: 'Apprentice Bunnybot',
    skillLevelValue: 3,
    depth: 3,
    thinkingTimeLimitsMs: [600, 5000]
  },
  [AiSkillLevel.Medium]: {
    aiUsername: 'Intermediate Bunnybot',
    skillLevelValue: 6,
    depth: 5,
    thinkingTimeLimitsMs: [400, 4000]
  },
  [AiSkillLevel.Hard]: {
    aiUsername: 'Expert Bunnybot',
    skillLevelValue: 10,
    depth: 8,
    thinkingTimeLimitsMs: [200, 3000]
  },
  [AiSkillLevel.VeryHard]: {
    aiUsername: 'Master Bunnybot',
    skillLevelValue: 20,
    depth: 10,
    thinkingTimeLimitsMs: [100, 2000]
  }
};

export class ChessAi {
  public static readonly id = 'ai';

  private _username;
  private _moveCallback;
  private _depth: number;
  private _skillLevelValue: number; // Stockfish skill level value, from 0 to 20
  private _thinkingTimeLimitsMs: [number, number];
  private _worker: Worker;

  constructor(
    public aiOptions: {
      skillLevel: AiSkillLevel;
      moveCallback: (move: { from: Square; to: Square; promotion: PieceSymbol }) => any;
    }
  ) {
    const { aiUsername, skillLevelValue, depth, thinkingTimeLimitsMs } =
      AI_SETTINGS[aiOptions.skillLevel];
    this._username = aiUsername;
    this._moveCallback = aiOptions.moveCallback;
    this._depth = depth;
    this._skillLevelValue = skillLevelValue;
    this._thinkingTimeLimitsMs = thinkingTimeLimitsMs;

    // Check if WebAssembly is supported and use Stockfish wasm version if possible
    const wasmSupported =
      typeof WebAssembly === 'object' &&
      WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
    this._worker = new Worker(wasmSupported ? '/stockfish.wasm.js' : '/stockfish.js');

    // Register callback to listen to bestmove messages
    // Message examples: 'bestmove e2e4' for standard move, 'bestmove e7e8q' for promotion (to queen, in this case)
    this._worker.onmessage = (event) => {
      if (event.data.startsWith('bestmove')) {
        const move = event.data.split(' ')[1];
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.substring(4, 5) || undefined;
        this._moveCallback({ from, to, promotion });
      }
    };

    this._worker.postMessage('uci');
    this._worker.postMessage(`setoption name Skill Level value ${this._skillLevelValue}`);
    this._worker.postMessage('isready');
  }

  async makeMove(fen: string): Promise<void> {
    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, random(...this._thinkingTimeLimitsMs)));
    this._worker.postMessage(`position fen ${fen}`);
    this._worker.postMessage(`go depth ${this._depth}`);
  }

  stop(): void {
    this._worker.terminate();
  }

  get username(): string {
    return this._username;
  }
}
