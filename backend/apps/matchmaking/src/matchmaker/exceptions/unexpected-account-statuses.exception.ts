export class UnexpectedAccountStatusesException extends Error {
  constructor(message = 'Unexpected account statuses') {
    super(message);
    this.name = UnexpectedAccountStatusesException.name;
  }
}
