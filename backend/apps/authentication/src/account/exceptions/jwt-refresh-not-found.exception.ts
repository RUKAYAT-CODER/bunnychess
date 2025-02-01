export class JwtRefreshNotFoundException extends Error {
  constructor(message = 'Jwt refresh token not found') {
    super(message);
    this.name = JwtRefreshNotFoundException.name;
  }
}
