import { isDatabaseError } from '@common/database/postgres/errors';
import { Injectable } from '@nestjs/common';
import { PostgresError } from 'pg-error-enum';
import { Database } from '../../database/database.module';
import { RankingAlreadyExistsException } from '../exceptions/ranking-already-exists.exception';
import { Ranking } from '../model/ranking.interface';

export interface RankingInsert {
  accountId: string;
  rankedMmr: number;
  normalMmr: number;
}

export interface RankingUpdate {
  gameId: string;
  gameType: string;
  ranked: boolean;
  accountId: string;
  mmrChange: number;
}

@Injectable()
export class RankingRepositoryService {
  constructor(private readonly database: Database) {}

  async insertRanking(ranking: RankingInsert): Promise<Ranking> {
    try {
      return await this.database
        .insertInto('ranking')
        .values({
          accountId: ranking.accountId,
          normalMmr: ranking.normalMmr,
          rankedMmr: ranking.rankedMmr,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (
        isDatabaseError(err, PostgresError.UNIQUE_VIOLATION) &&
        err.constraint === 'ranking_account_id_key'
      ) {
        throw new RankingAlreadyExistsException();
      }
      throw err;
    }
  }

  async updateRankings(updates: RankingUpdate[]): Promise<void> {
    return this.database.transaction().execute(async (trx) => {
      try {
        await trx.insertInto('mmrChange').values(updates).execute();
      } catch (err) {
        if (
          isDatabaseError(err, PostgresError.UNIQUE_VIOLATION) &&
          err.constraint === 'mmr_change_gameid_accountid_unique_index'
        ) {
          // Dedup
          return;
        }
        throw err;
      }
      for (const update of updates) {
        const mmrColumn = update.ranked ? 'rankedMmr' : 'normalMmr';
        await trx
          .updateTable('ranking')
          .set(({ eb }) => ({
            [mmrColumn]: eb(mmrColumn, '+', update.mmrChange),
          }))
          .where('accountId', '=', update.accountId)
          .execute();
      }
    });
  }

  async findRanking({ accountId }: { accountId: string }): Promise<Ranking | undefined> {
    const query = this.database
      .selectFrom('ranking')
      .selectAll()
      .where('accountId', '=', accountId);
    return query.executeTakeFirst();
  }
}
