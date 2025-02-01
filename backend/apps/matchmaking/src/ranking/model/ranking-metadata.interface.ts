export interface RankingMetadata {
  mmr: { [accountId: string]: number };
  ranked: boolean;
}
