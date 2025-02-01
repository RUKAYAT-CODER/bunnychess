export class GameOverException extends Error {
  constructor(message = 'Game is already over') {
    super(message);
    this.name = GameOverException.name;
  }
}
