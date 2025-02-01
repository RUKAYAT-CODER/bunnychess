import { kyselyPostgresProvider } from '@common/database/postgres/postgres-provider-factory';
import { Global, Module } from '@nestjs/common';
import { Kysely } from 'kysely';
import { env } from '../env';
import { DB } from './schema';

export class Database extends Kysely<DB> {}

@Global()
@Module({
  exports: [Database],
  providers: [kyselyPostgresProvider(env.postgresUrl, Database)],
})
export class DatabaseModule {}
