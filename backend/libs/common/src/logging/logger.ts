import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import winston from 'winston';

// Default winston logger for NestJS microservices
export function getLogger(serviceName: string) {
  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike(serviceName, {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
    ],
  });
}
