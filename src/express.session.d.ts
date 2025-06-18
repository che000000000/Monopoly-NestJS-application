import 'express-session'
import { SessionData } from 'express-session'
import { Socket } from 'socket.io'

declare module 'express-session' {
    interface SessionData {
        userId?: string
    }
}