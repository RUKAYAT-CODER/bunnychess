import { PostgresMigrator } from '@common/database/postgres/migrator';
import { Kysely, sql } from 'kysely';

export class MatchmakingMigrator extends PostgresMigrator {
  protected override serviceName = 'matchmaking';
  protected override migrations = [
    {
      name: '0000_add_ranking_table',
      up: async (db: Kysely<unknown>): Promise<void> => {
        await db.schema
          .createTable('ranking')
          .addColumn('id', 'text', (column) =>
            column.primaryKey().defaultTo(sql`gen_random_uuid()`),
          )
          .addColumn('accountId', 'text', (column) => column.notNull().unique())
          .addColumn('normalMmr', 'real', (column) => column.notNull())
          .addColumn('rankedMmr', 'real', (column) => column.notNull())
          .addColumn('createdAt', 'timestamptz', (column) => column.defaultTo(sql`now()`).notNull())
          .execute();
      },
      down: async (db: Kysely<unknown>): Promise<void> => {
        await db.schema.dropTable('ranking');
      },
    },
    {
      name: '0001_add_mmr_change_table',
      up: async (db: Kysely<unknown>): Promise<void> => {
        await db.schema
          .createTable('mmrChange')
          .addColumn('id', 'text', (column) =>
            column.primaryKey().defaultTo(sql`gen_random_uuid()`),
          )
          .addColumn('gameId', 'text', (column) => column.notNull())
          .addColumn('gameType', 'text', (column) => column.notNull())
          .addColumn('ranked', 'boolean', (column) => column.notNull())
          .addColumn('accountId', 'text', (column) => column.notNull())
          .addColumn('mmrChange', 'real', (column) => column.notNull())
          .addColumn('createdAt', 'timestamptz', (column) => column.defaultTo(sql`now()`).notNull())
          .execute();
        // Unique index to prevent at db level multiple mmr change records for the same game+account
        await await db.schema
          .createIndex('mmr_change_gameid_accountid_unique_index')
          .unique()
          .on('mmrChange')
          .columns(['gameId', 'accountId'])
          .execute();
      },
      down: async (db: Kysely<unknown>): Promise<void> => {
        await db.schema.dropTable('mmrChange');
      },
    },
  ];
}
