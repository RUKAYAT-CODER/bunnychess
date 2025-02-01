import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface MmrChangeSchema {
  accountId: string;
  createdAt: Generated<Timestamp>;
  gameId: string;
  gameType: string;
  id: Generated<string>;
  mmrChange: number;
  ranked: boolean;
}

export interface RankingSchema {
  accountId: string;
  createdAt: Generated<Timestamp>;
  id: Generated<string>;
  normalMmr: number;
  rankedMmr: number;
}

export interface DB {
  mmrChange: MmrChangeSchema;
  ranking: RankingSchema;
}
