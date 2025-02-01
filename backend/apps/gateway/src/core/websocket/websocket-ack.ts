// Client Socket.IO "emitWithAck" needs a return value from NestJS gateways, otherwise it throws a timeout error on client side.
// This is a simple way to standardize it.

export class Ack {}
