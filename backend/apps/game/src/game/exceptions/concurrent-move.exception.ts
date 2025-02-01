export class ConcurrentMoveException extends Error {
  constructor(message = 'Trying to update chess game with unexpected seq number') {
    super(message);
    this.name = ConcurrentMoveException.name;
  }
}
