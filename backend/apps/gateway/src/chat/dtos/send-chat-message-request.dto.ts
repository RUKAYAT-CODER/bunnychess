import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsNotEmpty()
  message: string;
}
