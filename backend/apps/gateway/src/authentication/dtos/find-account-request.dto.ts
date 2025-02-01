import { FindAccountRequestPb } from '@common/authentication/proto/account.pb';
import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class FindAccountRequestDto implements FindAccountRequestPb {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.email || o.id)
  id?: string | undefined | null;

  @IsEmail()
  @IsOptional()
  @ValidateIf((o) => !o.id || o.email)
  email?: string | undefined | null;
}
