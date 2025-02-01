import { getLogger } from '@common/logging/logger';
import { GrpcValidationPipe } from '@common/protobuf/grpc-validation.pipe';
import { useCustomProtobufTimestampHandler } from '@common/protobuf/protobufjs-wrapper';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AuthenticationMigrator } from './database/migrations';
import { env, grpcClientOptions } from './env';

async function bootstrap() {
  await new AuthenticationMigrator(env.postgresUrl).migrateToLatest();

  const app = await NestFactory.create(AppModule, {
    logger: getLogger('Authentication'),
  });
  app.connectMicroservice<MicroserviceOptions>(grpcClientOptions, { inheritAppConfig: true });
  app.useGlobalPipes(GrpcValidationPipe);
  app.enableShutdownHooks();
  useCustomProtobufTimestampHandler();

  await app.init();
  await app.startAllMicroservices();
}
bootstrap();
