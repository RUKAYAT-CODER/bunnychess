import { Injectable, Logger, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface LoggingContext {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
    requestId?: string;
    duration?: number;
    statusCode?: number;
    error?: any;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const startTime = Date.now();

        const loggingContext: LoggingContext = {
            method: request.method,
            url: request.url,
            userAgent: request.get('User-Agent'),
            ip: request.ip || request.connection.remoteAddress,
            userId: (request as any).user?.id,
            requestId: request.headers['x-request-id'] as string || this.generateRequestId(),
        };

        this.logger.log(`Incoming ${loggingContext.method} ${loggingContext.url}`, {
            ...loggingContext,
            type: 'request',
        });

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                loggingContext.duration = duration;
                loggingContext.statusCode = response.statusCode;

                this.logger.log(
                    `Completed ${loggingContext.method} ${loggingContext.url} - ${response.statusCode} (${duration}ms)`,
                    {
                        ...loggingContext,
                        type: 'response',
                        responseSize: JSON.stringify(data).length,
                    },
                );
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                loggingContext.duration = duration;
                loggingContext.statusCode = error.status || 500;
                loggingContext.error = {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                };

                this.logger.error(
                    `Failed ${loggingContext.method} ${loggingContext.url} - ${loggingContext.statusCode} (${duration}ms)`,
                    {
                        ...loggingContext,
                        type: 'error',
                    },
                );

                throw error;
            }),
        );
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 