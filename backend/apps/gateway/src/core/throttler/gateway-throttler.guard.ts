import { JwtData } from '@common/auth/model/jwt-user.interface';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';
import md5 from 'md5';
import { ClsServiceManager } from 'nestjs-cls';
import { Socket } from 'socket.io';

/* Throttler for both HTTP and WebSocket requests. */
@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(GatewayThrottlerGuard.name);

  override async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    let suffix: string;

    const contextType = context.getType();
    // Use accountId (if available) or ip address to identify the client
    switch (context.getType()) {
      case 'http':
        const request = context.switchToHttp().getRequest<Request>();
        suffix = ClsServiceManager.getClsService().get<JwtData>('jwt')?.accountId ?? request.ip;
        break;
      case 'ws':
        const client = context.switchToWs().getClient() as Socket & { jwtData?: JwtData };
        suffix = client.jwtData?.accountId ?? client.conn.remoteAddress;
        break;
      default:
        return false;
    }

    const key = this.generateKey(context, suffix, `${contextType}-${throttler.name}`);

    const { totalHits } = await this.storageService.increment(key, ttl);
    if (totalHits > limit) {
      this.logger.warn(
        `Throttler ${contextType} limit (${totalHits}/${limit}) reached in ${ttl} ms for id ${suffix} and key ${key}`,
      );
      throw new ThrottlerException();
    }

    return true;
  }

  override generateKey(context: ExecutionContext, suffix: string, name: string) {
    return md5(`${context.getHandler().name}-${name}-${suffix}`);
  }
}
