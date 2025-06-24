import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { ErrorTypes, WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "src/modules/pregame-rooms/pregame-rooms.service";
import { PlayersService } from "../players/players.service";
import { throwException } from "./common/throw-ws-exception";
import { ChatsService } from "../chats/chats.service";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'game',
    cors: {
        origin: true,
        credentials: true
    }
})
export class GameGateway {
    constructor(
        private readonly gamesService: GamesService,
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly usersService: UsersService,
        private readonly playersService: PlayersService
    ) { }

    @WebSocketServer()
    server: Server

    extractUserId(socket: SocketWithSession): string {
        const exctractedUserId = socket.request.session.userId
        if (!exctractedUserId) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `UserId doesn't extracted.`
            })
        }
        return exctractedUserId
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) {
            throwException(socket, {
                errorType: ErrorTypes.Internal,
                message: 'Failed to extract userId.'
            })
            return
        }

        const foundGame = await this.gamesService.findGameById(userId)
        if(!foundGame) return
        
        socket.join(foundGame.id)
        socket.join(foundGame.chatId)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createGame(
        @ConnectedSocket() socket: SocketWithSession,
    ) {
        const userId = this.extractUserId(socket)

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if(!foundRoom) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in the pregame room.`
            })
        }
        if(foundRoom.ownerId !== userId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't owner of this pregame room.`
            })
        }

        const newGame = await this.gamesService.createGame({
            roomId: foundRoom.id
        })
        if('errorType' in newGame) {
            throw new WsException({
                errorType: newGame.errorType,
                message: newGame.message
            })
        }
    }
}