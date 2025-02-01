import { status } from '@grpc/grpc-js';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/*
 * A gRPC validation pipe that automatically translates NestJS validation errors into gRPC INVALID_ARGUMENT errors.
 */
export const GrpcValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    return new RpcException({
      code: status.INVALID_ARGUMENT,
      message: JSON.stringify(
        validationErrors.reduce(
          (result, validationError) => {
            result[validationError.property] = Object.values(validationError.constraints!);
            return result;
          },
          {} as Record<string, string[]>,
        ),
      ),
    });
  },
});
