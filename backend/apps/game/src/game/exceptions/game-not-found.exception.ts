export class GameNotFoundException extends Error {
  constructor(message = 'Game not found') {
    super(message);
    this.name = GameNotFoundException.name;
  }
}
