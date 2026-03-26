import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (isHttpException) {
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse) {
        const payload = errorResponse as Record<string, unknown>;
        const payloadMessage = payload.message;

        if (Array.isArray(payloadMessage)) {
          message = payloadMessage.join(', ');
        } else if (typeof payloadMessage === 'string') {
          message = payloadMessage;
        }

        if (typeof payload.code === 'string') {
          code = payload.code;
        } else {
          code = exception.name.toUpperCase();
        }
      }
    }

    response.status(statusCode).json({
      success: false,
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
