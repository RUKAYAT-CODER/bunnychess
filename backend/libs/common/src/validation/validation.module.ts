import { Module } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                skipMissingProperties: false,
                skipNullProperties: false,
                skipUndefinedProperties: false,
                validationError: {
                    target: false,
                    value: false,
                },
                exceptionFactory: (errors) => {
                    const messages = errors.map(error => ({
                        field: error.property,
                        constraints: error.constraints,
                        value: error.value,
                    }));

                    return {
                        statusCode: 400,
                        message: 'Validation failed',
                        error: 'Bad Request',
                        details: messages,
                        timestamp: new Date().toISOString(),
                    };
                },
            }),
        },
    ],
})
export class ValidationModule { } 