export enum GameType {
  Rapid_10_0 = '10+0',
  Blitz_5_3 = '5+3',
  Blitz_5_0 = '5+0',
  Blitz_3_2 = '3+2',
  Blitz_3_0 = '3+0',
  Bullet_1_0 = '1+0',
}

export function isGameType(gameType: unknown): asserts gameType is GameType {
  if (typeof gameType === 'string' && !Object.values(GameType).includes(gameType as GameType)) {
    throw new UnknownGameTypeException(
      `Not recognized gameType ${gameType}; possible values: ${Object.values(GameType)}`,
    );
  }
}

export class UnknownGameTypeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = UnknownGameTypeException.name;
  }
}
