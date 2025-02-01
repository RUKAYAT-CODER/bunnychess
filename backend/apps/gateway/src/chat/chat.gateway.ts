import { Jwt } from '@common/auth/decorators/jwt.decorator';
import { RequireUser } from '@common/auth/decorators/require-user.decorator';
import { JwtData } from '@common/auth/model/jwt-user.interface';
import { MessageBody, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { randomUUID } from 'crypto';

import { Server } from 'socket.io';
import { WebsocketController } from '../core/websocket/websocket-controller.decorator';
import { SendChatMessageRequestDto } from './dtos/send-chat-message-request.dto';

@WebsocketController()
export class ChatGateway {
  @WebSocketServer() io: Server;

  @SubscribeMessage('chat:send-message')
  @RequireUser()
  async handleSendMessage(
    @MessageBody() { gameId, message }: SendChatMessageRequestDto,
    @Jwt() { username }: JwtData,
  ): Promise<void> {
    this.io.to(gameId).emit('chat:message', { username, message, id: randomUUID() });
  }
}
