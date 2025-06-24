import { ErrorTypes } from "../filters/WsExcepton.filter"

export type WsExceptionData = {
    errorType: ErrorTypes,
    message: string,
    from: string
}