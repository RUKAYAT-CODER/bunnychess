export interface GameStateUpdateEvent {
  accountId: string;
  gameId: string;
  move: string;
  fen: string;
  seq: number;
  clocks: {
    w: number;
    b: number;
  };
}
