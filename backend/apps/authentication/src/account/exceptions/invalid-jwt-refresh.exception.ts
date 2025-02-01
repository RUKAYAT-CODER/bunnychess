export class InvalidJwtRefreshException extends Error {
  constructor(message = 'Invalid jwt refresh token') {
    super(message);
    this.name = InvalidJwtRefreshException.name;
  }
}
