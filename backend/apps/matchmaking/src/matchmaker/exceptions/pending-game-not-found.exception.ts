export class PendingGameNotFoundException extends Error {
  constructor(message = 'Pending game not found') {
    super(message);
    this.name = PendingGameNotFoundException.name;
  }
}
