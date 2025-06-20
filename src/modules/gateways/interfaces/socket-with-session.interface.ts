import { SessionData } from "express-session"
import { Socket } from "socket.io"

export interface SocketWithSession extends Socket {
    request: { 
        session: SessionData & { userId?: string } 
    } & Socket['request']
}