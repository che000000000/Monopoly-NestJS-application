import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { ErrorType } from '../constants/error-types';
import { WsExceptionData } from '../types/ws-exception-data.type';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException)
export class WsExceptionsFilter extends BaseWsExceptionFilter {
	catch(exception: WsException | HttpException, host: ArgumentsHost) {
		const client = host.switchToWs().getClient<Socket>()
		let errorType: ErrorType = ErrorType.INTERNAL
		let message = 'An error occurred'

		if (exception instanceof HttpException) {
			const status = exception.getStatus()
			const response = exception.getResponse()

			errorType = this.determineErrorType(status)

			message = this.extractErrorMessage(exception, response)
		} else {
			const exceptionData = exception.getError()
			message = this.extractWsExceptionMessage(exceptionData)

			if (this.isWsExceptionData(exceptionData)) {
				errorType = exceptionData.errorType
			}
		}

		client.emit('exceptions', {
			errorType,
			message
		})
	}

	private determineErrorType(status: number): ErrorType {
		switch (status) {
			case 400: return ErrorType.BAD_REQUEST
			case 401: return ErrorType.UNAUTHORIZED
			case 403: return ErrorType.FORBIDDEN
			case 404: return ErrorType.NOT_FOUND
			case 409: return ErrorType.CONFLICT
			case 422: return ErrorType.UNPROCESSABLE_ENTITY
			default: return ErrorType.INTERNAL
		}
	}

	private extractErrorMessage(exception: HttpException, response: any): string {
		if (typeof response === 'string') {
			return response
		}

		if (typeof response === 'object' && response !== null) {
			return response.message || exception.message
		}

		return exception.message
	}

	private extractWsExceptionMessage(exceptionData: any): string {
		if (typeof exceptionData === 'string') {
			return exceptionData
		}

		if (this.isWsExceptionData(exceptionData)) {
			return exceptionData.message
		}

		return 'WebSocket error occurred'
	}

	private isWsExceptionData(data: unknown): data is WsExceptionData {
		return (
			typeof data === 'object' &&
			data !== null &&
			'errorType' in data &&
			'message' in data
		)
	}
}