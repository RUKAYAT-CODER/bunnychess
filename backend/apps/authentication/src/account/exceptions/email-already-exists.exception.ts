export class EmailAlreadyExistsException extends Error {
  constructor(message = 'Email already exists') {
    super(message);
    this.name = EmailAlreadyExistsException.name;
  }
}
