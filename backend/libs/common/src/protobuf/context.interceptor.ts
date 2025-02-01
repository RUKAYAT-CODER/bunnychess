import { InterceptingCall } from '@grpc/grpc-js';
import { InterceptingCallInterface } from '@grpc/grpc-js/build/src/client-interceptors';
import { ClsServiceManager } from 'nestjs-cls';
import { JwtData } from '../auth/model/jwt-user.interface';

// grpc-js interceptor to automatically add jwt and tracing to the gRPC client call happening outside NestJS context.
export const contextInterceptor = function (jwtName: string) {
  return (options: any, nextCall: (arg0: any) => InterceptingCallInterface) => {
    const requester = {
      start: function (
        metadata: any,
        listener: any,
        next: (
          arg0: any,
          arg1: {
            onReceiveMessage: (message: any, next: any) => void;
            onReceiveStatus: (status: any, next: any) => void;
          },
        ) => void,
      ) {
        const cls = ClsServiceManager.getClsService();

        const requestId = cls.get<string>('requestId');
        const jwtData = cls.get<JwtData>(jwtName);

        if (requestId) {
          metadata.set('requestId', requestId);
        }
        if (jwtData) {
          metadata.set(jwtName, JSON.stringify(jwtData));
        }

        next(metadata, listener);
      },
      sendMessage: function (message: any, next: (arg0: any) => void) {
        next(message);
      },
    };
    return new InterceptingCall(nextCall(options), requester);
  };
};
