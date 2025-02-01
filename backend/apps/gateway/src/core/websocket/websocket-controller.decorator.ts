import { ContextGuard } from '@common/auth/guards/context.guard';
import { applyDecorators, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { env } from '../../env';
import { GatewayThrottlerGuard } from '../throttler/gateway-throttler.guard';
import { WebsocketExceptionFilter } from './websocket-exception.filter';

export function WebsocketController() {
  return applyDecorators(
    WebSocketGateway({
      cors: {
        origin: env.corsUrls,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    }),
    UseGuards(ContextGuard, GatewayThrottlerGuard),
    UsePipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    ),
    UseFilters(new WebsocketExceptionFilter()),
  );
}
