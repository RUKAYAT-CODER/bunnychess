export class WrongPasswordException extends Error {
  constructor(message = 'Wrong password') {
    super(message);
    this.name = WrongPasswordException.name;
  }
}
