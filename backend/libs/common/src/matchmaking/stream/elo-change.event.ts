export interface EloChangeEvent {
  accountId: string;
  newElo: number;
  eloChange: number;
  ranked: boolean;
}
