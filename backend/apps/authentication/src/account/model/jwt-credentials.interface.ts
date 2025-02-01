export interface JwtCredentials {
  jwt: string;
  jwtExpires: Date;
  jwtRefresh: string;
  jwtRefreshExpires: Date;
}
