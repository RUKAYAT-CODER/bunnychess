import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';

export function getLogger(serviceName: string) {
  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: serviceName,
          message,
          ...meta,
        });
      })
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
          })
        ),
      }),
    ],
  });
}

// Enhanced logger with request context
export function getRequestLogger(serviceName: string) {
  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
        ),
      }),
    ],
  });
}
