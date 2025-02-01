import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptGameRequestDto {
  @IsString()
  @IsNotEmpty()
  pendingGameId: string;
}
