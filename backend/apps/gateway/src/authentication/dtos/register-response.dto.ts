import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  @Expose()
  email: string;

  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdAt: Date;
}
