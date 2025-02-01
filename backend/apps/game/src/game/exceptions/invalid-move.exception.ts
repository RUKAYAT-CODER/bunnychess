export class InvalidMoveException extends Error {
  constructor(message = 'Invalid move') {
    super(message);
    this.name = InvalidMoveException.name;
  }
}
