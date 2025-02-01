import { isGrpcException } from '@common/protobuf/grpc-to-http-exception.filter';
import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

interface WsError {
  isWsError: true;
  message: any;
  code?: number;
}

// Send a special callback message to allow client Socket.IO "emitWithAck" method to try/catch server errors,
// otherwise only timeout errors are caught.
@Catch()
export class WebsocketExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost) {
    const callback = host.getArgByIndex(2);
    if (callback && typeof callback === 'function') {
      try {
        isGrpcException(exception);
        callback({ isWsError: true, message: exception.details, code: exception.code } as WsError);
      } catch (_err) {
        callback({ isWsError: true, message: (exception as Error).message } as WsError);
      }
    } else {
      if (exception instanceof ThrottlerException) {
        // Already handled inside GatewayThrottlerGuard
        return;
      }
      this.logger.error(exception);
    }
  }
}
