import { IsNotEmpty, IsString } from 'class-validator';

export class CheckResultRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;
}
