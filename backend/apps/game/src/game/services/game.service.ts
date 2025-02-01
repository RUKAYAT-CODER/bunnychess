import { GameType } from '@common/game/model/game-type';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { shuffle } from 'lodash';
import { GameNotFoundException } from '../exceptions/game-not-found.exception';
import { CHECK_GAME_QUEUE, CheckGameJob } from '../job/check-game.queue';
import { ChessGame, MAX_MOVES } from '../model/chess-game';
import { GAME_RULES } from '../model/game-rules';
import { GameRepositoryService } from '../repositories/game.repository.service';
import { StreamService } from './stream.service';

export interface CreateGame {
  accountId0: string;
  accountId1: string;
  gameType: GameType;
  metadata: string;
}

export interface MakeMove {
  accountId: string;
  gameId: string;
  move: string;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly gameRepository: GameRepositoryService,
    private readonly streamService: StreamService,
    @InjectQueue(CHECK_GAME_QUEUE) private checkGameQueue: Queue,
  ) {}

  /**
   * Create and start a new chess game.
   * Also add a check game job to the queue to ensure the game is processed after a certain time.
   *
   * @param param account ids, game type and arbitrary metadata that will be stored with the game
   * and emitted when game ends
   * @returns chess game instance
   */
  async createGame({ accountId0, accountId1, gameType, metadata }: CreateGame): Promise<ChessGame> {
    // Randomly assign colors
    const [whiteAccountId, blackAccountId] = shuffle([accountId0, accountId1]);
    const chessGame = ChessGame.fromScratch({
      gameType,
      accountIds: { w: whiteAccountId, b: blackAccountId },
      metadata,
      gameRules: GAME_RULES[gameType],
    });
    await this.gameRepository.storeGame(chessGame);
    await this.streamService.emitGameStart({
      accountId0,
      accountId1,
      gameId: chessGame.id,
    });
    this.addGameToCheckGameQueue(chessGame);
    this.logger.log(
      `Game ${chessGame.id} (${gameType}) created, w: ${whiteAccountId}, b: ${blackAccountId}`,
    );
    return chessGame;
  }

  /**
   * Find a game by id or throw error if not found.
   *
   * @param gameId game id
   * @returns chess game instance
   */
  async getGameOrThrow(gameId: string): Promise<ChessGame> {
    const chessGame = await this.gameRepository.findGame(gameId);
    if (!chessGame) {
      throw new GameNotFoundException(`Couldn't find game ${gameId}`);
    }
    return chessGame;
  }

  /**
   * Make a move in a game by an account id.
   *
   * @param param account id, game id and move in algebraic notation
   * @returns chess game instance after the move
   */
  async makeMove({ accountId, gameId, move }: MakeMove): Promise<ChessGame> {
    const chessGame = await this.getGameOrThrow(gameId);
    chessGame.move(accountId, move);
    await this.gameRepository.updateGame(chessGame);
    await this.streamService.emitGameStateUpdate({
      accountId,
      gameId,
      move,
      fen: chessGame.fen,
      seq: chessGame.seq,
      clocks: chessGame.gameClocks,
    });
    this.checkGameResult(chessGame).catch((_) => null);
    this.logger.debug(`Game ${gameId}: move "${move}" by ${accountId}`);
    return chessGame;
  }

  /**
   * Check if the game has ended and - if so - go through game end logic.
   * Do nothing if game has not ended yet.
   *
   * @param chessGame chess game instance to check
   * @returns true if game has ended, false otherwise
   */
  async checkGameResult(chessGame: ChessGame): Promise<boolean> {
    const result = chessGame.checkGameResult();
    if (!result) {
      return false;
    }
    await this.streamService.emitGameOver({
      gameId: chessGame.id,
      accountId0: chessGame.accountIds.w,
      accountId1: chessGame.accountIds.b,
      winnerAccountId: result.winnerAccountId,
      outcome: result.outcome,
      gameType: chessGame.gameType,
      metadata: chessGame.metadata,
      gameOverReason: result.reason,
    });
    this.logger.log(`Game ${chessGame.id}: emitted game over event`);
    await this.checkGameQueue.remove(chessGame.id);
    await this.gameRepository.deleteGame(chessGame.id);
    return true;
  }

  /**
   * Resign from a game by an account id, ending the match with a loss for resigned account.
   *
   * @param param resigning account id and game id
   * @returns chess game instance after resignation
   */
  async resign({ accountId, gameId }: { accountId: string; gameId: string }): Promise<ChessGame> {
    const chessGame = await this.getGameOrThrow(gameId);
    chessGame.resign(accountId);
    await this.gameRepository.updateGame(chessGame);
    await this.checkGameResult(chessGame);
    this.logger.debug(`Game ${gameId}: ${accountId} resigned`);
    return chessGame;
  }

  private async addGameToCheckGameQueue({ id, gameRules }: ChessGame): Promise<void> {
    try {
      await this.checkGameQueue.add(
        CheckGameJob.CheckGame,
        { gameId: id },
        {
          jobId: id,
          // Theoretical maximum time for a game
          delay: gameRules.timeLimitMs * 2 + gameRules.timeIncreasePerTurnMs * MAX_MOVES,
        },
      );
    } catch (err) {
      this.logger.error(`Error adding game ${id} to check queue`, err);
    }
  }
}
