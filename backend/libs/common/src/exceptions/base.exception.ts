import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    code?: string;
    details?: any;
    timestamp: string;
}

export abstract class BaseException extends HttpException {
    public readonly code: string;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        code?: string,
        details?: any,
    ) {
        super(message, statusCode);
        this.code = code || this.constructor.name;
        this.details = details;
    }

    public toResponse(): ErrorResponse {
        return {
            statusCode: this.getStatus(),
            message: this.message,
            error: HttpStatus[this.getStatus()],
            code: this.code,
            details: this.details,
            timestamp: new Date().toISOString(),
        };
    }
}

// Specific exception types
export class ValidationException extends BaseException {
    constructor(message: string, details?: any) {
        super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationException extends BaseException {
    constructor(message: string = 'Authentication failed') {
        super(message, HttpStatus.UNAUTHORIZED, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationException extends BaseException {
    constructor(message: string = 'Access denied') {
        super(message, HttpStatus.FORBIDDEN, 'AUTHORIZATION_ERROR');
    }
}

export class ResourceNotFoundException extends BaseException {
    constructor(resource: string, id?: string) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(message, HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND');
    }
}

export class ConflictException extends BaseException {
    constructor(message: string, details?: any) {
        super(message, HttpStatus.CONFLICT, 'CONFLICT_ERROR', details);
    }
}

export class RateLimitException extends BaseException {
    constructor(message: string = 'Too many requests') {
        super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_ERROR');
    }
} 