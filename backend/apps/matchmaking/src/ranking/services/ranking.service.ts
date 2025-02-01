import { Injectable, Logger } from '@nestjs/common';
import { RankingAlreadyExistsException } from '../exceptions/ranking-already-exists.exception';
import { RankingMetadata } from '../model/ranking-metadata.interface';
import { Ranking } from '../model/ranking.interface';
import { RankingRepositoryService } from '../repositories/ranking.repository.service';
import { StreamService } from './stream.service';

export interface GameResult {
  accountId0: string;
  accountId1: string;
  winnerAccountId?: string | undefined;
  gameId: string;
  gameType: string;
  rankingMetadata: RankingMetadata;
}

export interface RankingInsert {
  accountId: string;
  rankedMmr: number;
  normalMmr: number;
}

export interface EloResult {
  accountId: string;
  eloChange: number;
  newElo: number;
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  private readonly STARTING_MMR = 1000;

  constructor(
    private readonly rankingRepository: RankingRepositoryService,
    private readonly streamService: StreamService,
  ) {}

  /**
   * Process game result and update players' rankings using Elo rating system.
   *
   * @param param game result data
   */
  async processGameResult({
    accountId0,
    accountId1,
    winnerAccountId,
    gameId,
    gameType,
    rankingMetadata: { mmr, ranked },
  }: GameResult): Promise<void> {
    const mmr0 = mmr[accountId0];
    const mmr1 = mmr[accountId1];

    // No winner account means draw
    const eloResult = this.calculateElo(
      winnerAccountId ? (winnerAccountId === accountId0 ? 1 : 0) : 0.5,
      accountId0,
      mmr0,
      accountId1,
      mmr1,
    );

    await this.rankingRepository.updateRankings(
      eloResult.map((result) => ({
        accountId: result.accountId,
        gameId,
        gameType,
        ranked,
        mmrChange: result.eloChange,
      })),
    );
    eloResult.map((result) =>
      this.streamService
        .emitEloChange({
          accountId: result.accountId,
          eloChange: result.eloChange,
          newElo: result.newElo,
          ranked,
        })
        .catch((err) =>
          this.logger.error(
            `Could not emit elo change message for account ${result.accountId}`,
            err,
          ),
        ),
    );
    this.logger.log(
      `Processed game result for ${ranked ? 'ranked' : 'normal'} ${gameType} game ${gameId}: ${
        winnerAccountId ? `${winnerAccountId} won` : 'draw'
      }, ${eloResult[0].accountId} ${mmr0}->${eloResult[0].newElo} (${eloResult[0].eloChange}), ${
        eloResult[1].accountId
      } ${mmr1}->${eloResult[1].newElo} (${eloResult[1].eloChange})`,
    );
  }

  /**
   * Get ranking for account or create a new one if it doesn't exist.
   *
   * @param accountId account id
   * @returns account ranking data
   */
  async getOrCreateRanking(accountId: string): Promise<Ranking> {
    const ranking = await this.rankingRepository.findRanking({ accountId });
    if (ranking) {
      return ranking;
    }

    try {
      return await this.rankingRepository.insertRanking({
        accountId,
        normalMmr: this.STARTING_MMR,
        rankedMmr: this.STARTING_MMR,
      });
    } catch (err) {
      // Ignore insert race condition
      if (err instanceof RankingAlreadyExistsException) {
        return this.getRankingOrDefault(accountId);
      }
      throw err;
    }
  }

  /**
   * Get ranking data for account or default ranking if it doesn't exist (new players that never played a game might
   * not have a ranking entry in the database yet).
   *
   * @param accountId account id
   * @returns account ranking data or default
   */
  async getRankingOrDefault(accountId: string): Promise<Ranking> {
    const ranking = await this.rankingRepository.findRanking({ accountId });
    return (
      ranking ?? {
        accountId,
        normalMmr: this.STARTING_MMR,
        rankedMmr: this.STARTING_MMR,
      }
    );
  }

  /**
   * Calculate Elo rating change for two players depending on match result.
   *
   * @param result 1 if accountId0 won, 0 if accountId1 won, 0.5 if draw
   * @param accountId0 account id of player 0
   * @param accountId0Elo current Elo rating of player 0
   * @param accountId1 account id of player 1
   * @param accountId1Elo current Elo rating of player 1
   * @returns array of new account rankings
   */
  private calculateElo(
    result: number,
    accountId0: string,
    accountId0Elo: number,
    accountId1: string,
    accountId1Elo: number,
  ): EloResult[] {
    if (![1, 0, 0.5].includes(result) || accountId0Elo < 0 || accountId1Elo < 0) {
      throw new Error('Invalid input');
    }

    // The K factor determines how much the ratings are adjusted after each game
    const K_FACTOR = 20;

    const expectedResult0 = 1 / (1 + 10 ** ((accountId1Elo - accountId0Elo) / 400));
    const expectedResult1 = 1 - expectedResult0;

    const actualResult0 = result === 1 ? 1 : result === 0.5 ? 0.5 : 0;
    const actualResult1 = 1 - actualResult0;

    const eloChange0 = K_FACTOR * (actualResult0 - expectedResult0);
    const eloChange1 = K_FACTOR * (actualResult1 - expectedResult1);

    const newElo0 = accountId0Elo + eloChange0;
    const newElo1 = accountId1Elo + eloChange1;

    return [
      {
        accountId: accountId0,
        eloChange: eloChange0,
        newElo: newElo0,
      },
      {
        accountId: accountId1,
        eloChange: eloChange1,
        newElo: newElo1,
      },
    ];
  }
}
