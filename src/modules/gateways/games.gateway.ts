import { forwardRef, Inject, UseFilters } from "@nestjs/common";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { throwException } from "./common/throw-ws-exception";
import { Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'games',
    cors: {
        origin: true,
        credentials: true
    }
})
export class GamesGateway implements OnGatewayConnection {
    constructor(
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService,
        private readonly usersService: UsersService
    ) { }

    @WebSocketServer()
    server: Server

    async handleConnection(socket: SocketWithSession) {
        const userId = socket.request.session.userId
        if(!userId) {
            throwException(socket, 'Unauthorized.')
            return
        }
        
        const foundGame = await this.gamesService.findGameByUserId(userId)
        if(!foundGame) {
            throwException(socket, 'User not a member of the game.')
            return
        }

        socket.join(foundGame.chatId)
    }
}