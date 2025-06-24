import { forwardRef, Inject, UseFilters } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { Server } from "socket.io";
import { GamesService } from "../../games/games.service";
import { UsersService } from "../../users/users.service";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'games',
    cors: {
        origin: true,
        credentials: true
    }
})
export class GamesGateway {
    constructor(
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService,
        private readonly usersService: UsersService
    ) { }

    @WebSocketServer()
    server: Server
}