import { ErrorTypes } from "../filters/WsExcepton.filter"

export type ExceptionData = {
    errorType: ErrorTypes,
    message: string
}