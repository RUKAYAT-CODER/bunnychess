import { status } from '@grpc/grpc-js';
import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { GrpcException } from './grpc.exception';

export function isGrpcException(exception: unknown): asserts exception is GrpcException {
  const grpcException = exception as unknown as GrpcException;
  if (
    grpcException.code == null ||
    grpcException.details == null ||
    grpcException.metadata == null
  ) {
    throw new Error();
  }
}

/**
 * To be used in the Gateway to easily translate unhandled gRPC errors from microservices into HTTP status codes.
 */
@Catch()
export class GrpcToHttpExceptionFilter<T = any> extends BaseExceptionFilter<T> {
  override catch(exception: T, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      super.catch(exception, host);
      return;
    }

    try {
      isGrpcException(exception);
    } catch (_err) {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const mapper: Record<number, number> = {
      [status.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
      [status.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
      [status.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
      [status.NOT_FOUND]: HttpStatus.NOT_FOUND,
      [status.ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [status.ABORTED]: HttpStatus.GONE,
      [status.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
      [status.CANCELLED]: 499,
      [status.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
      [status.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
      [status.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
      [status.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [status.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
      [status.OUT_OF_RANGE]: HttpStatus.PAYLOAD_TOO_LARGE,
      [status.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_FAILED,
    };

    const statusCode = mapper[exception.code];
    const type = HttpStatus[statusCode];

    const responsePayload: Record<string, any> = {
      statusCode,
      message: exception.details,
      error: type,
    };

    // Check if Bad Request was thrown by class-validator: when using GrpcValidationPipe, message is a valid JSON object
    if (statusCode === HttpStatus.BAD_REQUEST && responsePayload.message) {
      try {
        responsePayload.validationErrors = JSON.parse(exception.details);
        responsePayload.message = 'Validation error';
      } catch (_err) {
        // This Bad Request wasn't thrown by class-validator: keep original message
      }
    }

    response.status(statusCode).json(responsePayload);
  }
}
