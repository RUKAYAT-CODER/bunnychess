import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class MeResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  username: string;

  @IsBoolean()
  @IsNotEmpty()
  @Expose()
  isAdmin: boolean;

  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdAt?: Date | null;

  @IsDate()
  @IsOptional()
  @Expose()
  lastLoginAt?: Date | null;

  @IsDate()
  @IsNotEmpty()
  @Expose()
  status: string;

  @IsString()
  @IsOptional()
  @Expose()
  gameType?: string | null;

  @IsBoolean()
  @IsOptional()
  @Expose()
  ranked?: boolean | null;

  @IsString()
  @IsOptional()
  @Expose()
  gameId?: string | null;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  mmr: number;
}
