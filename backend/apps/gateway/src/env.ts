import { CommonAppEnvironment } from '@common/env';
import { Env, getEnvironment } from '@pietrobassi/environment';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class GatewayAppEnvironment extends CommonAppEnvironment {
  @Env()
  @IsNumber()
  @Type(() => Number)
  httpGatewayPort: number = 3000;

  @Env()
  @IsString()
  jwtRefreshName: string = 'jwtRefresh';

  @Env()
  @IsString()
  jwtRefreshFlagName: string = 'jwtRefreshFlag';

  @Env()
  @IsArray()
  @IsString({ each: true })
  @Transform((prop) => (prop.value as string).split(' '))
  corsUrls: string[] = 'http://localhost:5173' as unknown as string[];
}

export const env = getEnvironment<GatewayAppEnvironment>(GatewayAppEnvironment, {
  envFilePath: './apps/gateway/.env',
  loadEnvFile: true,
});
