export class TurnException extends Error {
  constructor(message = 'Wrong turn') {
    super(message);
    this.name = TurnException.name;
  }
}
