import { UseFilters, UseGuards } from "@nestjs/common";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { ErrorTypes, WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { throwException } from "./common/throw-ws-exception";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'game',
    cors: {
        origin: true,
        credentials: true
    }
})
export class GamesGateway implements OnGatewayConnection {
    constructor(private readonly gamesService: GamesService) { }

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
                message: `Failed to extract userId.`,
                from: `GamesGateway`
            })
            socket.disconnect()
            return
        }

        const foundGame = await this.gamesService.findGameByUserId(userId)
        if (!foundGame) return

        socket.join(foundGame.id)
        socket.join(foundGame.chatId)
    }
}