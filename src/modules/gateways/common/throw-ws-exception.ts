import { SocketWithSession } from "../interfaces/socket-with-session.interface"
import { ExceptionData } from "../types/exception-data.type"
 
export function throwException(socket: SocketWithSession, dto: ExceptionData ) {
    socket.emit('exceptions', {
        errorType: dto.errorType,
        message: dto.message,
    })
    socket.disconnect()
}