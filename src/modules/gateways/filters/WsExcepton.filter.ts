import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

export enum ErrorTypes {
  Unauthorized = 'Unauthorized',
  BadRequest = 'BadRequest'
}

@Catch(WsException)
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient()
    const exceptionData = exception.getError()

    if (typeof exceptionData === 'object' && 'errorType' in exceptionData && 'message' in exceptionData) {
      const { errorType, message } = exceptionData

      switch (errorType) {
        case ErrorTypes.Unauthorized: {
          client.emit('exceptions', {
            event: 'Error',
            errorType: errorType,
            message: message,
          })
          client.disconnect()
          break
        }
        case ErrorTypes.BadRequest: {
          client.emit('exceptions', {
            event: 'Error',
            errorType: errorType,
            message: message,
          })
          break
        }
        default: {
          client.emit('exceptions', {
            event: 'Error',
            errorType: 'Unhandled exception',
            message: 'An unknown error occurred',
          })
        }
      }
    } else {
      client.emit('exceptions', {
        event: 'Error',
        errorType: 'Unhandled exception',
        message: 'Invalid error format',
      })
    }
  }
}