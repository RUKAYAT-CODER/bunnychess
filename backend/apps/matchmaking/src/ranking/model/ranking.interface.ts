export interface Ranking {
  id?: string | undefined;
  accountId: string;
  rankedMmr: number;
  normalMmr: number;
  createdAt?: Date | undefined;
}
