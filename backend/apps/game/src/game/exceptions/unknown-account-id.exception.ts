export class UnknownAccountIdException extends Error {
  constructor(message = 'Unknown account id') {
    super(message);
    this.name = UnknownAccountIdException.name;
  }
}
