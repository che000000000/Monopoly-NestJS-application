import { UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { ErrorTypes } from "./constants/error-types";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameGateway } from "./pregame.gateway";

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
        private readonly gamesService: GamesService,
        private readonly pregameGamteway: PregameGateway
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
        if(!userId) {
            socket.disconnect()
            return
        }
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('new-game')
    async newGame(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const newGame = await this.gamesService.initGame({
            userId: userId
        })

        await Promise.all(
            newGame.players.map(async (player) => {
                const userId = player.user ? player.user.id : null
                if (!userId) return
                await this.pregameGamteway.removeSocketFromRooms({
                    userId
                })
            })
        )

        this.server.emit('games', {
            event: 'new-game',
            newGame
        })
    }
}