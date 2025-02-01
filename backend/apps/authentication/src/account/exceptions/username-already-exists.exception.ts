export class UsernameAlreadyExistsException extends Error {
  constructor(message = 'Username already exists') {
    super(message);
    this.name = UsernameAlreadyExistsException.name;
  }
}
