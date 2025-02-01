import { io, type Socket } from 'socket.io-client';

export interface WsError {
  isWsError: true;
  message: string;
  code?: number;
}

export const socket: Socket = io(import.meta.env.VITE_WS_URL ?? '/', {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket', 'polling'],
  secure: true
});

// Monkey patch emitWithAck to allow try/catch on server errors (otherwise only timeout errors are caught) and set deafult timeout to 5 seconds.
const originalEmitWithAckFn = socket.emitWithAck.bind(socket);
const emitWithAckAndTimeout = (event: string, payload: any) => {
  const emitWithAckAndTimeoutFn = originalEmitWithAckFn.bind(socket.timeout(5000));
  return emitWithAckAndTimeoutFn(event, payload);
};
socket.emitWithAck = async function (event: string, payload: any) {
  const ackResponse = await emitWithAckAndTimeout(event, payload);
  if (ackResponse.isWsError) {
    throw new Error(ackResponse.message);
  }
  return ackResponse;
};
