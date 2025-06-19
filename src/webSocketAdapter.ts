import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { RedisStore } from "connect-redis";
import * as cookieParser from 'cookie-parser'
import * as session from "express-session";
import { ServerOptions } from "socket.io";

export class SessionSocketAdapter extends IoAdapter {
    private readonly cookieMiddleware: any
    private readonly sessionMiddleware: any

    constructor(
        private readonly app: INestApplication,
        private readonly configService: ConfigService,
        private readonly redisStore: RedisStore
    ) {
        super(app)

        this.cookieMiddleware = cookieParser(this.configService.get('sessions.cookieSecret'))

        this.sessionMiddleware = session({
            secret: this.configService.getOrThrow('sessions.secret'),
            name: this.configService.get('sessions.name'),
            resave: true,
            saveUninitialized: false,
            cookie: {
                domain: this.configService.get('sessions.domain'),
                maxAge: 86400 * 1000,
                httpOnly: true,
                secure: false,
                sameSite: this.configService.get('sessions.sameSite')
            },
            store: this.redisStore,
        })
    }

    create(port: number, options?: ServerOptions) {
        const server = super.create(port, options)

        server.use((socket: any, next: any) => {
            this.cookieMiddleware(socket.request, {}, () => {
                this.sessionMiddleware(socket.request, {}, next)
            })
        })
        return server
    }
}