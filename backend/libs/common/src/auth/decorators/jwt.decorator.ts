import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { JwtData } from '../model/jwt-user.interface';

// Decorator to get JWT data from context
export const Jwt = createParamDecorator(
  (_data: any, _ctx: ExecutionContext): JwtData | undefined => {
    const cls = ClsServiceManager.getClsService();
    return cls.get<JwtData>('jwt');
  },
);
