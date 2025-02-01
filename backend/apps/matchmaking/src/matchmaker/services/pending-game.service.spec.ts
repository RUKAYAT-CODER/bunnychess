const pendingGameId = 'a97bfb50-a96f-41a5-b95c-3bd9606cb198';
const gameId = '09a92fcc-6ad9-4fb5-add5-05c599c050db';
jest.mock('crypto', () => ({ randomUUID: () => pendingGameId }));
jest.mock('rxjs', () => ({ firstValueFrom: () => ({ gameId }) }));

import { GameType } from '@common/game/model/game-type';
import { GameServiceClient } from '@common/game/proto/game.pb';
import { ClientGrpc } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { mock } from 'jest-mock-extended';
import { Ranking } from '../../ranking/model/ranking.interface';
import { RankingService } from '../../ranking/services/ranking.service';
import { PendingGameJob } from '../job/pending-game.queue';
import { PlayerStatus } from '../model/player-status.enum';
import { PendingGameRepositoryService } from '../repositories/pending-game.repository.service';
import {
  AcceptPendingGame,
  CancelPendingGame,
  CreatePendingGame,
  PendingGameService,
} from './pending-game.service';
import { PlayerStatusService } from './player-status.service';
import { StreamService } from './stream.service';

describe('PendingGameService', () => {
  let service: PendingGameService;
  const pendingGameQueue = mock<Queue>();
  const grpcGameService = mock<GameServiceClient>();
  const gameClient = mock<ClientGrpc>();
  gameClient.getService.mockReturnValue(grpcGameService);
  const pendingGameRepository = mock<PendingGameRepositoryService>();
  const playerStatusService = mock<PlayerStatusService>();
  const streamService = mock<StreamService>();
  const rankingService = mock<RankingService>();

  beforeEach(async () => {
    jest.clearAllMocks();

    service = new PendingGameService(
      pendingGameQueue,
      gameClient,
      pendingGameRepository,
      playerStatusService,
      streamService,
      rankingService,
    );
    service.onModuleInit();
  });

  describe('createPendingGame', () => {
    const param: CreatePendingGame = {
      accountId0: 'account0',
      accountId1: 'account1',
      gameType: GameType.Rapid_10_0,
      ranked: true,
    };

    it('should store new pending game in the repository', async () => {
      await service.createPendingGame(param);

      expect(pendingGameRepository.createPendingGame).toHaveBeenCalledWith({
        ...param,
        pendingGameId: pendingGameId,
        timeoutSeconds: expect.any(Number),
      });
    });

    it('should emit a pending game ready event', async () => {
      await service.createPendingGame(param);

      expect(streamService.emitPendingGameReady).toHaveBeenCalledWith({
        accountId0: param.accountId0,
        accountId1: param.accountId1,
        pendingGameId: pendingGameId,
      });
    });

    it('should add the pending game to the timeout queue', async () => {
      await service.createPendingGame(param);

      expect(pendingGameQueue.add).toHaveBeenCalledWith(
        PendingGameJob.Timeout,
        {
          accountId0: param.accountId0,
          accountId1: param.accountId1,
          pendingGameId: pendingGameId,
        },
        {
          jobId: expect.any(String),
          delay: expect.any(Number),
        },
      );
    });

    it('should return newly created pending game id', async () => {
      await service.createPendingGame(param);

      expect(service.createPendingGame(param)).resolves.toEqual(pendingGameId);
    });
  });

  describe('acceptPendingGame', () => {
    const param: AcceptPendingGame = {
      accountId: 'account0',
      pendingGameId: pendingGameId,
    };
    const acceptPendingGameMockedValue = {
      readyPlayersCount: 2,
      gameType: GameType.Rapid_10_0,
      accountIds: [param.accountId, 'account1'],
      ranked: true,
    };

    beforeEach(() => {
      jest
        .spyOn(pendingGameRepository, 'acceptPendingGame')
        .mockResolvedValue(acceptPendingGameMockedValue);
      jest
        .spyOn(rankingService, 'getRankingOrDefault')
        .mockResolvedValue({ rankedMmr: 1000 } as Ranking);
    });

    it('should store new game state in the repository', async () => {
      await service.acceptPendingGame(param);

      expect(pendingGameRepository.acceptPendingGame).toHaveBeenCalledWith(param);
    });

    it.each([-1, 0, 1, 3])(
      'should not create new game if ready players count is equal to %i',
      async (readyPlayersCount) => {
        jest.spyOn(pendingGameRepository, 'acceptPendingGame').mockResolvedValue({
          ...acceptPendingGameMockedValue,
          readyPlayersCount,
        });

        await service.acceptPendingGame(param);

        expect(grpcGameService.createGame).not.toHaveBeenCalled();
      },
    );

    it('should create a new game', async () => {
      await service.acceptPendingGame(param);

      expect(grpcGameService.createGame).toHaveBeenCalledWith({
        accountId0: param.accountId,
        accountId1: 'account1',
        gameType: GameType.Rapid_10_0,
        metadata: expect.any(String),
      });
    });

    it('should include players ranking and game type (ranked or not) in metadata object', async () => {
      await service.acceptPendingGame(param);

      expect(JSON.parse(grpcGameService.createGame.mock.calls[0][0].metadata)).toMatchObject({
        mmr: { account0: 1000, account1: 1000 },
        ranked: true,
      });
    });

    it('should remove game from pending game queue', async () => {
      await service.acceptPendingGame(param);

      expect(pendingGameQueue.remove).toHaveBeenCalledWith(pendingGameId);
    });

    it('should set new player statuses', async () => {
      await service.acceptPendingGame(param);

      expect(playerStatusService.setPlayerStatuses).toHaveBeenCalledWith(
        acceptPendingGameMockedValue.accountIds.map((accountId) => ({
          accountId,
          newStatus: {
            gameId,
            gameType: acceptPendingGameMockedValue.gameType,
            ranked: acceptPendingGameMockedValue.ranked,
            status: PlayerStatus.Playing,
          },
        })),
      );
    });

    it.each([1, 2])('should return ready players count (=%i)', async (readyPlayersCount) => {
      jest.spyOn(pendingGameRepository, 'acceptPendingGame').mockResolvedValue({
        ...acceptPendingGameMockedValue,
        readyPlayersCount,
      });

      expect(service.acceptPendingGame(param)).resolves.toEqual(readyPlayersCount);
    });
  });

  describe('cancelPendingGame', () => {
    const param: CancelPendingGame = {
      pendingGameId,
      accountId0: 'account0',
      accountId1: 'account1',
    };

    beforeEach(() => {
      jest.spyOn(pendingGameRepository, 'cancelPendingGame').mockResolvedValue(true);
    });

    it('should delete pending game from repository', async () => {
      await service.cancelPendingGame(param);

      expect(pendingGameRepository.cancelPendingGame).toHaveBeenCalledWith(param);
    });

    it('should remove pending game from queue', async () => {
      await service.cancelPendingGame(param);

      expect(pendingGameQueue.remove).toHaveBeenCalledWith(pendingGameId);
    });

    it('should emit pending game timeout event', async () => {
      await service.cancelPendingGame(param);

      expect(streamService.emitPendingGameTimeout).toHaveBeenCalledWith(param);
    });

    it.each([true, false])(
      `should return whether pending game was cancelled or not from repository (=%s)`,
      async (deleted) => {
        jest.spyOn(pendingGameRepository, 'cancelPendingGame').mockResolvedValue(deleted);

        await service.cancelPendingGame(param);

        expect(service.cancelPendingGame(param)).resolves.toBe(deleted);
      },
    );
  });
});
