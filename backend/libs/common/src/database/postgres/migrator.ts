import { CamelCasePlugin, Kysely, Migration, Migrator, PostgresDialect } from 'kysely';
import { map, zipObject } from 'lodash';
import { Pool } from 'pg';

export interface PostgresMigration extends Migration {
  name: string;
}

/**
 * Helper class for running Kysely Postgres migrations.
 *
 * Ideally, migrations are run by DevOps in a more controlled way, since they could heavily impact performance
 * once database becomes big.
 */
export abstract class PostgresMigrator {
  protected abstract serviceName: string;
  protected abstract migrations: PostgresMigration[];

  constructor(private connectionString: string) {}

  async migrateToLatest(): Promise<void> {
    const database = new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: this.connectionString,
        }),
      }),
      plugins: [new CamelCasePlugin()],
    });

    const migrator = new Migrator({
      db: database,
      provider: {
        getMigrations: () =>
          Promise.resolve(
            zipObject(
              map(this.migrations, 'name'),
              map(this.migrations, (migration) => ({ up: migration.up, down: migration.down })),
            ),
          ),
      },
      migrationTableName: `kysely_migration_${this.serviceName}`,
      migrationLockTableName: `kysely_migration_lock_${this.serviceName}`,
    });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((migrationResult) => {
      if (migrationResult.status === 'Success') {
        console.log(`Migration "${migrationResult.migrationName}" was executed successfully`);
      } else if (migrationResult.status === 'Error') {
        console.error(`Failed to execute migration "${migrationResult.migrationName}"`);
      }
    });

    if (error) {
      console.error('Failed to migrate', error);
      process.exit(1);
    }

    await database.destroy();
  }
}
