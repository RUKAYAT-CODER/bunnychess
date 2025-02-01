import { JwtData } from '@common/auth/model/jwt-user.interface';
import { Socket } from 'socket.io';

export interface JwtSocket extends Socket {
  jwtData?: JwtData;
}
