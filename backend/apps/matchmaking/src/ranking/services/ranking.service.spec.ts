import { GameType } from '@common/game/model/game-type';
import { mock } from 'jest-mock-extended';
import { RankingAlreadyExistsException } from '../exceptions/ranking-already-exists.exception';
import { Ranking } from '../model/ranking.interface';
import { RankingRepositoryService } from '../repositories/ranking.repository.service';
import { GameResult, RankingService } from './ranking.service';
import { StreamService } from './stream.service';

describe('RankingService', () => {
  let service: RankingService;
  const rankingRepository = mock<RankingRepositoryService>();
  const streamService = mock<StreamService>();
  let eloChange: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    service = new RankingService(rankingRepository, streamService);
    eloChange = jest.spyOn(service as any, 'calculateElo');
  });

  describe('processGameResult', () => {
    const param: GameResult = {
      accountId0: 'account0',
      accountId1: 'account1',
      winnerAccountId: 'account0',
      gameId: 'gameId',
      gameType: GameType.Rapid_10_0,
      rankingMetadata: {
        mmr: { account0: 1000, account1: 1000 },
        ranked: true,
      },
    };

    beforeEach(() => {
      jest
        .spyOn(streamService, 'emitEloChange')
        .mockImplementation(jest.fn<any, any>(() => ({ catch: jest.fn() })));
    });

    it.each([
      { ...param, rankingMetadata: { mmr: { account0: 1000, account1: -100 }, ranked: true } },
      { ...param, rankingMetadata: { mmr: { account0: -100, account1: 1000 }, ranked: true } },
      { ...param, rankingMetadata: { mmr: { account0: -100, account1: -100 }, ranked: true } },
    ])('should throw error on invalid input', async (invalidParam) => {
      expect(service.processGameResult(invalidParam)).rejects.toThrow();
      expect(rankingRepository.updateRankings).not.toHaveBeenCalled();
      expect(streamService.emitEloChange).not.toHaveBeenCalled();
    });

    it('should correctly calculate Elo changes when first player wins', async () => {
      const result: GameResult = {
        ...param,
        winnerAccountId: param.accountId0,
        rankingMetadata: { mmr: { account0: 1000, account1: 1000 }, ranked: true },
      };

      await service.processGameResult(result);

      const eloChanges = eloChange.mock.results[0].value;

      expect(eloChanges[0].eloChange).toBeGreaterThan(0);
      expect(eloChanges[0].newElo).toBeGreaterThan(result.rankingMetadata.mmr[result.accountId0]);
      expect(eloChanges[1].eloChange).toBeLessThan(0);
      expect(eloChanges[1].newElo).toBeLessThan(result.rankingMetadata.mmr[result.accountId1]);
    });

    it('should correctly calculate Elo changes when second player wins', async () => {
      const result: GameResult = {
        ...param,
        winnerAccountId: param.accountId1,
        rankingMetadata: { mmr: { account0: 1000, account1: 1000 }, ranked: true },
      };

      await service.processGameResult(result);

      const eloChanges = eloChange.mock.results[0].value;

      expect(eloChanges[0].eloChange).toBeLessThan(0);
      expect(eloChanges[0].newElo).toBeLessThan(result.rankingMetadata.mmr[result.accountId0]);
      expect(eloChanges[1].eloChange).toBeGreaterThan(0);
      expect(eloChanges[1].newElo).toBeGreaterThan(result.rankingMetadata.mmr[result.accountId1]);
    });

    it('should correctly calculate Elo changes on draw if players have equal Elo', async () => {
      const result: GameResult = {
        ...param,
        winnerAccountId: undefined,
      };

      await service.processGameResult(result);

      const eloChanges = eloChange.mock.results[0].value;

      expect(eloChanges[0].eloChange).toEqual(0);
      expect(eloChanges[0].newElo).toEqual(result.rankingMetadata.mmr[result.accountId0]);
      expect(eloChanges[1].eloChange).toEqual(0);
      expect(eloChanges[1].newElo).toEqual(result.rankingMetadata.mmr[result.accountId1]);
    });

    it('should favor player with lower Elo on draw', async () => {
      const result: GameResult = {
        ...param,
        winnerAccountId: undefined,
        rankingMetadata: { mmr: { account0: 800, account1: 1000 }, ranked: true },
      };

      await service.processGameResult(result);

      const eloChanges = eloChange.mock.results[0].value;

      expect(eloChanges[0].eloChange).toBeGreaterThan(0);
      expect(eloChanges[0].newElo).toBeGreaterThan(result.rankingMetadata.mmr[result.accountId0]);
      expect(eloChanges[1].eloChange).toBeLessThan(0);
      expect(eloChanges[1].newElo).toBeLessThan(result.rankingMetadata.mmr[result.accountId1]);
    });

    it('should compute a higher Elo change when difference between players Elo rankings is bigger', async () => {
      await service.processGameResult({
        ...param,
        winnerAccountId: undefined,
        rankingMetadata: { mmr: { account0: 10, account1: 1000 }, ranked: true },
      });
      await service.processGameResult({
        ...param,
        winnerAccountId: undefined,
        rankingMetadata: { mmr: { account0: 990, account1: 1000 }, ranked: true },
      });

      const bigDiffEloChanges = eloChange.mock.results[0].value;
      const smallDiffEloChanges = eloChange.mock.results[1].value;

      expect(bigDiffEloChanges[0].eloChange).toBeGreaterThan(smallDiffEloChanges[0].eloChange);
      expect(bigDiffEloChanges[1].eloChange).toBeLessThan(smallDiffEloChanges[1].eloChange);
    });

    it('should update Elo ranking for both players', async () => {
      await service.processGameResult(param);

      const eloChanges = eloChange.mock.results[0].value;

      expect(rankingRepository.updateRankings).toHaveBeenCalledWith([
        {
          accountId: param.accountId0,
          gameId: param.gameId,
          gameType: param.gameType,
          mmrChange: eloChanges[0].eloChange,
          ranked: param.rankingMetadata.ranked,
        },
        {
          accountId: param.accountId1,
          gameId: param.gameId,
          gameType: param.gameType,
          mmrChange: eloChanges[1].eloChange,
          ranked: param.rankingMetadata.ranked,
        },
      ]);
    });

    it('should emit an Elo change event for every player', async () => {
      await service.processGameResult(param);

      const eloChanges = eloChange.mock.results[0].value;

      for (const eloChange of eloChanges) {
        expect(streamService.emitEloChange).toHaveBeenCalledWith({
          accountId: eloChange.accountId,
          eloChange: eloChange.eloChange,
          newElo: eloChange.newElo,
          ranked: param.rankingMetadata.ranked,
        });
      }
    });
  });

  describe('getOrCreateRanking', () => {
    it('should return account ranking when found in the repository', async () => {
      const storedRanking = {} as Ranking;
      jest.spyOn(rankingRepository, 'findRanking').mockResolvedValue(storedRanking);

      const ranking = await service.getOrCreateRanking('accountId0');

      expect(ranking).toEqual(storedRanking);
    });

    describe('when ranking is not found in the repository', () => {
      beforeEach(() => {
        jest.spyOn(rankingRepository, 'findRanking').mockResolvedValue(undefined);
      });

      it('should insert new ranking entry with default values in the repository', async () => {
        const insertRankingSpy = jest
          .spyOn(rankingRepository, 'insertRanking')
          .mockResolvedValue({} as Ranking);

        await service.getOrCreateRanking('accountId0');

        expect(insertRankingSpy).toHaveBeenCalledWith({
          accountId: 'accountId0',
          normalMmr: 1000,
          rankedMmr: 1000,
        });
      });

      it('should return newly inserted ranking entry', async () => {
        const ranking = {} as Ranking;
        jest.spyOn(rankingRepository, 'insertRanking').mockResolvedValue(ranking);

        expect(service.getOrCreateRanking('accountId0')).resolves.toEqual(ranking);
      });

      it('should ignore insert race conditions and just return existing ranking entry', async () => {
        const alreadyExistingRanking = {} as Ranking;
        jest
          .spyOn(rankingRepository, 'insertRanking')
          .mockRejectedValue(new RankingAlreadyExistsException());
        jest.spyOn(rankingRepository, 'findRanking').mockResolvedValue(alreadyExistingRanking);

        expect(service.getOrCreateRanking('accountId0')).resolves.toEqual(alreadyExistingRanking);
      });
    });
  });

  describe('getRankingOrDefault', () => {
    it('should return account ranking when found in the repository', async () => {
      const storedRanking = {} as Ranking;
      jest.spyOn(rankingRepository, 'findRanking').mockResolvedValue(storedRanking);

      const ranking = await service.getRankingOrDefault('accountId0');

      expect(ranking).toEqual(storedRanking);
    });

    it('should return default account ranking when not found in the repository', async () => {
      jest.spyOn(rankingRepository, 'findRanking').mockResolvedValue(undefined);

      const ranking = await service.getRankingOrDefault('accountId0');

      expect(ranking).toEqual({
        accountId: 'accountId0',
        normalMmr: 1000,
        rankedMmr: 1000,
      });
    });
  });
});
