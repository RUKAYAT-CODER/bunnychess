import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AccountResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

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

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  mmr: number;
}
