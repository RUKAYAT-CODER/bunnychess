import { PostgresMigrator } from '@common/database/postgres/migrator';
import { Kysely, sql } from 'kysely';

export class AuthenticationMigrator extends PostgresMigrator {
  protected override serviceName = 'authentication';
  protected override migrations = [
    {
      name: '0000_add_account_table',
      up: async (db: Kysely<unknown>): Promise<void> => {
        await sql`create extension if not exists citext`.execute(db);
        await db.schema
          .createTable('account')
          .addColumn('id', 'text', (column) =>
            column.primaryKey().defaultTo(sql`gen_random_uuid()`),
          )
          .addColumn('username', sql`citext`, (column) => column.notNull().unique())
          .addColumn('email', 'text', (column) => column.notNull().unique())
          .addColumn('password', 'text', (column) => column.notNull())
          .addColumn('createdAt', 'timestamptz', (column) => column.defaultTo(sql`now()`).notNull())
          .addColumn('lastLoginAt', 'timestamptz')
          .addColumn('isAdmin', 'boolean', (column) => column.notNull().defaultTo(false))
          .execute();
      },
      down: async (db: Kysely<unknown>): Promise<void> => {
        await db.schema.dropTable('account');
      },
    },
  ];
}
