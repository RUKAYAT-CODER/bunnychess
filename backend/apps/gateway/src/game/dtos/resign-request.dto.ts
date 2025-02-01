import { IsNotEmpty, IsString } from 'class-validator';

export class ResignRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;
}
