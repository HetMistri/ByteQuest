import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('ByteQuest API')
    .setDescription('Event-based competitive programming platform API')
    .setVersion('1.0.0')
    .addTag('users', 'User authentication and management')
    .addTag('events', 'Event management (coming soon)')
    .addTag('problems', 'Problem management (coming soon)')
    .addTag('submissions', 'Code submission handling (coming soon)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`API Documentation available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
