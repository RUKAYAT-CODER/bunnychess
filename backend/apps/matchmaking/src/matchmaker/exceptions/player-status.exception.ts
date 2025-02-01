export class PlayerStatusException extends Error {
  constructor(message = 'Unexpected player status') {
    super(message);
    this.name = PlayerStatusException.name;
  }
}
