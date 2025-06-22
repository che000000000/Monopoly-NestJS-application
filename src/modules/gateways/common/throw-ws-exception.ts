import { SocketWithSession } from "../interfaces/socket-with-session.interface"

export function throwException(socket: SocketWithSession, error_message: string) {
    socket.emit('exceptions', {
        event: 'Error',
        message: error_message,
    })
    socket.disconnect()
}