import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class AddToQueueRequestDto {
  @IsString()
  @IsNotEmpty()
  gameType: string;

  @IsBoolean()
  @IsNotEmpty()
  ranked: boolean;
}
