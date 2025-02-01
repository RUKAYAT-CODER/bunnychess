import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';

import { JwtData } from '@common/auth/model/jwt-user.interface';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtSocket } from '../core/websocket/model/account-socket.interface';
import { WebsocketController } from '../core/websocket/websocket-controller.decorator';
import { WebsocketService } from '../core/websocket/websocket.service';
import { MatchmakingService } from '../matchmaking/matchmaking.service';

@WebsocketController()
export class ConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConnectionGateway.name);

  @WebSocketServer() io: Server;

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly jwtService: JwtService,
    private readonly matchmakingService: MatchmakingService,
  ) {}

  afterInit() {
    this.websocketService.socket = this.io;
  }

  // Only authorize clients with valid jwt and send them their current account status
  async handleConnection(client: Socket & { jwtData?: JwtData }): Promise<void> {
    let jwtData: JwtData;
    const jwt = this.getCookieValue('jwt', client.handshake.headers.cookie);
    if (!jwt) {
      client.emit('socket:missing-jwt', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    try {
      jwtData = await this.jwtService.verifyAsync<JwtData>(jwt);
    } catch (_err) {
      this.logger.warn('Client tried to connect with invalid jwt');
      client.emit('socket:missing-jwt', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    // Use client Socket object as a cache to store verified jwtData
    client.jwtData = jwtData;

    await client.join(jwtData.accountId);
    const accountStatus = await this.matchmakingService.getAccountStatus({
      accountId: client.jwtData.accountId,
    });
    if (accountStatus.status) {
      client.emit('matchmaking:account-status-update', accountStatus);
    }
  }

  handleDisconnect(client: JwtSocket): void {
    const accountId = client.jwtData?.accountId;
    if (accountId) {
      this.matchmakingService.removeFromQueue({ accountId }).catch(() => null);
    }
  }

  private getCookieValue(cookieName: string, cookieHeader: string | undefined): string | undefined {
    return cookieHeader?.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)')?.pop() || undefined;
  }
}
