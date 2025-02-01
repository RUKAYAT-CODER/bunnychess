import { IsString, IsNotEmpty } from 'class-validator';

export class MakeMoveRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  move: string;
}
