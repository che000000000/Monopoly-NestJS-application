import { ErrorType } from "../constants/error-types";

export type WsExceptionData = {
    errorType: ErrorType,
    message: string,
}