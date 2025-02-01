import { CamelCasePlugin, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

/**
 * Factory function for creating a Kysely Postgres provider.
 */
export const kyselyPostgresProvider = (connectionString: string, DatabaseClass: any) => ({
  provide: DatabaseClass,
  useFactory: () => {
    const dialect = new PostgresDialect({
      pool: new Pool({
        connectionString,
      }),
    });

    return new DatabaseClass({
      dialect,
      // UNCOMMENT THIS TO LOG ALL QUERIES:
      // log(event: any) {
      //   if (event.level === 'query') {
      //     console.log('Query:', event.query.sql);
      //     console.log('Parameters:', event.query.parameters);
      //   }
      // },
      plugins: [new CamelCasePlugin()],
    });
  },
});
