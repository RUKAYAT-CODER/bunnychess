import { Env } from '@pietrobassi/environment';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { Algorithm as JwtAlgorithm } from 'jsonwebtoken';

export class CommonAppEnvironment {
  @Env()
  @IsString()
  jwtPublicKey: string;

  @Env()
  @IsString()
  @Transform((prop) => prop.value.replace(/\\n/g, '\n'))
  jwtAlgorithm: JwtAlgorithm = 'ES512';

  @Env()
  @IsString()
  jwtName: string = 'jwt';

  @Env()
  @IsString()
  grpcAuthenticationUrl: string;

  @Env()
  @IsString()
  grpcMatchmakingUrl: string;

  @Env()
  @IsString()
  grpcGameUrl: string;

  @Env()
  @IsString()
  redisHost: string;

  @Env()
  @IsNumber()
  @Type(() => Number)
  redisPort: number;

  @Env()
  @IsString()
  redisPassword: string;

  @Env()
  @IsString()
  natsUrl: string;

  @Env()
  @IsString()
  natsUser: string;

  @Env()
  @IsString()
  natsPassword: string;
}
