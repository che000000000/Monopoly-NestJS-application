import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { HttpException } from '@nestjs/common';
import { ErrorTypes } from '../constants/error-types';
import { WsExceptionData } from '../types/ws-exception-data.type';

@Catch(WsException, HttpException)
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient()
    let errorType: ErrorTypes = ErrorTypes.Internal
    let message = 'An error occurred'

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()

      switch (status) {
        case 400: errorType = ErrorTypes.BadRequest; break
        case 401: errorType = ErrorTypes.Unauthorized; break
        case 403: errorType = ErrorTypes.Forbidden; break
        case 404: errorType = ErrorTypes.NotFound; break
        default: errorType = ErrorTypes.Internal
      }

      message = typeof response === 'object'
        ? (response as any).message || exception.message
        : exception.message
    } else {
      const exceptionData = exception.getError();

      if (typeof exceptionData === 'string') {
        message = exceptionData;
      } else if (this.isWsExceptionData(exceptionData)) {
        message = exceptionData.message
        errorType = exceptionData.errorType
      }
    }

    client.emit('exceptions', {
      event: 'Error',
      errorType,
      message,
    })
  }

  private isWsExceptionData(data: unknown): data is WsExceptionData {
    return typeof data === 'object' &&
      data !== null &&
      'errorType' in data &&
      'message' in data
  }
}