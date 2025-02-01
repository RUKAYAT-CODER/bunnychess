import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGameRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;
}
