import { GameType } from '@common/game/model/game-type';
import { Queue } from 'bullmq';
import { mock } from 'jest-mock-extended';
import * as _ from 'lodash';
import { GameNotFoundException } from '../exceptions/game-not-found.exception';
import { CheckGameJob } from '../job/check-game.queue';
import { ChessGame, GameOverReason, GameResult, MAX_MOVES } from '../model/chess-game';
import { GAME_RULES } from '../model/game-rules';
import { GameRepositoryService } from '../repositories/game.repository.service';
import { CreateGame, GameService, MakeMove } from './game.service';
import { StreamService } from './stream.service';

jest.mock('lodash', () => {
  return {
    __esModule: true,
    ...jest.requireActual('lodash'),
  };
});

describe('GameService', () => {
  let service: GameService;
  const gameRepository = mock<GameRepositoryService>();
  const streamService = mock<StreamService>();
  const checkGameQueue = mock<Queue>();

  const accountId0 = 'accountId0';
  const accountId1 = 'accountId1';
  const newChessGame = () =>
    ChessGame.fromScratch({
      gameType: GameType.Rapid_10_0,
      accountIds: { w: accountId0, b: accountId1 },
      metadata: '',
      gameRules: GAME_RULES[GameType.Rapid_10_0],
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    service = new GameService(gameRepository, streamService, checkGameQueue);
  });

  describe('createGame', () => {
    const param: CreateGame = {
      accountId0,
      accountId1,
      gameType: GameType.Rapid_10_0,
      metadata: '{ "some": "metadata" }',
    };

    it('should store the game in the repository', async () => {
      const chessGame = await service.createGame(param);

      expect(gameRepository.storeGame).toHaveBeenCalledWith(chessGame);
    });

    it('should emit a game start event', async () => {
      const chessGame = await service.createGame(param);

      expect(streamService.emitGameStart).toHaveBeenCalledWith({
        accountId0: param.accountId0,
        accountId1: param.accountId1,
        gameId: chessGame.id,
      });
    });

    it('should add the game to the check game queue to ensure the result is always processed', async () => {
      const { id } = await service.createGame(param);

      expect(checkGameQueue.add).toHaveBeenCalledWith(
        CheckGameJob.CheckGame,
        { gameId: id },
        {
          jobId: id,
          delay: expect.any(Number),
        },
      );
    });

    it.each([Object.values(GameType)])(
      'should set delay value of the check game job to the correct amount, depending on game type and rules',
      async (gameType) => {
        const { gameRules } = await service.createGame({ ...param, gameType });

        expect(checkGameQueue.add).toHaveBeenCalledWith(
          expect.any(String),
          { gameId: expect.any(String) },
          {
            jobId: expect.any(String),
            delay: gameRules.timeLimitMs * 2 + gameRules.timeIncreasePerTurnMs * MAX_MOVES,
          },
        );
      },
    );

    it('should shuffle players to determine who starts as white', async () => {
      const shuffleSpy = jest
        .spyOn(_, 'shuffle')
        .mockImplementation(jest.fn<any, any>((array: [string, string]) => [array[1], array[0]]));

      const chessGame = await service.createGame(param);

      expect(shuffleSpy).toHaveBeenCalledWith([param.accountId0, param.accountId1]);
      expect(chessGame.accountIds).toMatchObject({ w: param.accountId1, b: param.accountId0 });
    });
  });

  describe('getGameOrThrow', () => {
    const gameId = 'gameId';
    let chessGame: ChessGame;

    beforeEach(() => {
      chessGame = newChessGame();
    });

    it('should find game in repository by id', async () => {
      const findGameSpy = jest.spyOn(gameRepository, 'findGame').mockResolvedValue(chessGame);

      await service.getGameOrThrow(gameId);

      expect(findGameSpy).toHaveBeenCalledWith(gameId);
    });

    it('should return chess game instance if found', async () => {
      jest.spyOn(gameRepository, 'findGame').mockResolvedValue(chessGame);

      expect(service.getGameOrThrow(gameId)).resolves.toBe(chessGame);
    });

    it('should throw a game not found exception if game is not found in the repository', async () => {
      jest.spyOn(gameRepository, 'findGame').mockResolvedValue(undefined);

      expect(service.getGameOrThrow(gameId)).rejects.toThrow(GameNotFoundException);
    });
  });

  describe('makeMove', () => {
    const param: MakeMove = {
      accountId: accountId0,
      gameId: 'gameId',
      move: 'a4',
    };
    let chessGameFromRepository: ChessGame;

    beforeEach(() => {
      chessGameFromRepository = newChessGame();
      jest.spyOn(gameRepository, 'findGame').mockResolvedValue(chessGameFromRepository);
    });

    it('should throw a game not found exception if game is not found', async () => {
      jest.spyOn(gameRepository, 'findGame').mockResolvedValue(undefined);

      expect(service.makeMove(param)).rejects.toThrow(GameNotFoundException);
    });

    it('should store updated game state in the repository', async () => {
      const updateGameSpy = jest.spyOn(gameRepository, 'updateGame');

      await service.makeMove(param);

      expect(updateGameSpy.mock.lastCall?.[0].history[0]).toEqual(param.move);
    });

    it('should emit a game status update event with all the relevant information', async () => {
      await service.makeMove(param);

      expect(streamService.emitGameStateUpdate).toHaveBeenCalledWith({
        accountId: param.accountId,
        gameId: param.gameId,
        move: param.move,
        fen: chessGameFromRepository.fen,
        seq: 1,
        clocks: {
          w: expect.any(Number),
          b: expect.any(Number),
          startTimestamp: chessGameFromRepository.gameClocks.startTimestamp,
          lastMoveTimestamp: expect.any(Number),
        },
      });
    });

    it('should check game result', async () => {
      const checkGameResultSpy = jest.spyOn(service, 'checkGameResult');

      await service.makeMove(param);

      expect(checkGameResultSpy).toHaveBeenCalledWith(chessGameFromRepository);
    });

    it('should return the updated chess game instance', async () => {
      expect(service.makeMove(param)).resolves.toBe(chessGameFromRepository);
    });
  });

  describe('checkGameResult', () => {
    let chessGame: ChessGame;
    const result: GameResult = {
      outcome: 'w',
      winnerAccountId: accountId0,
      reason: GameOverReason.Resignation,
    };

    beforeEach(() => {
      chessGame = newChessGame();
      chessGame.resign(accountId1);
      jest.spyOn(ChessGame.prototype, 'checkGameResult').mockReturnValue(result);
    });

    it('should return false if game is still being played', async () => {
      jest.spyOn(ChessGame.prototype, 'checkGameResult').mockReturnValue(undefined);

      expect(service.checkGameResult(chessGame)).resolves.toBe(false);
    });

    it('should return true if game has ended', async () => {
      expect(service.checkGameResult(chessGame)).resolves.toBe(true);
    });

    it('should emit a game over event with all the relevant information', async () => {
      await service.checkGameResult(chessGame);

      expect(streamService.emitGameOver).toHaveBeenCalledWith({
        gameId: chessGame.id,
        accountId0: chessGame.accountIds.w,
        accountId1: chessGame.accountIds.b,
        winnerAccountId: result.winnerAccountId,
        outcome: result.outcome,
        gameType: chessGame.gameType,
        metadata: chessGame.metadata,
        gameOverReason: result.reason,
      });
    });

    it('should remove the game from the check game queue', async () => {
      await service.checkGameResult(chessGame);

      expect(checkGameQueue.remove).toHaveBeenCalledWith(chessGame.id);
    });

    it('should delete game from repository', async () => {
      await service.checkGameResult(chessGame);

      expect(gameRepository.deleteGame).toHaveBeenCalledWith(chessGame.id);
    });
  });
});
