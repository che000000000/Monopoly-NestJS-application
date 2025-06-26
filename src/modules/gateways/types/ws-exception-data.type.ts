import { ErrorTypes } from "../constants/error-types";

export type WsExceptionData = {
    errorType: ErrorTypes,
    message: string,
}