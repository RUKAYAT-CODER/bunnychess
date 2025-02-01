export interface GameOverEvent {
  accountId0: string;
  accountId1: string;
  outcome: string;
  gameOverReason: string;
  winnerAccountId?: string;
  gameId: string;
  gameType: string;
  metadata: string;
}
