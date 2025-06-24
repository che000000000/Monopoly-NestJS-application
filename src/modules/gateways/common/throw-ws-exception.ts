import { SocketWithSession } from "../interfaces/socket-with-session.interface"
import { WsExceptionData } from "../types/ws-exception-data.type"
 
export function throwException(socket: SocketWithSession, dto: WsExceptionData ) {
    socket.emit('exceptions', {
        errorType: dto.errorType,
        message: dto.message,
        from: dto.from
    })
}