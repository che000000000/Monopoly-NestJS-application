import { InternalServerErrorException, NotFoundException, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { ErrorTypes } from "./constants/error-types";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameGateway } from "./pregame.gateway";
import { PlayersService } from "../players/players.service";
import { UsersService } from "../users/users.service";
import { GameTurnsService } from "../game-turns/game-turns.service";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";

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
        private readonly usersService: UsersService,
        private readonly gamesService: GamesService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly playersService: PlayersService,
        private readonly pregameGamteway: PregameGateway,
        private readonly pregameRoomsService: PregameRoomsService
    ) { }

    @WebSocketServer()
    server: Server

    extractUserId(socket: SocketWithSession): string {
        const exctractedUserId = socket.request.session.userId
        if (!exctractedUserId) {
            throw new InternalServerErrorException(`UserId doesn't extracted.`)
        }
        return exctractedUserId
    }

    private async findSocketByUser(userId: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.find(socket => socket.data.userId === userId)
    }

    private async findSocketsByUsers(usersIds: string[]): Promise<RemoteSocket<DefaultEventsMap, any>[] | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.filter(socket => usersIds.includes(socket.data.userId))
    }

    private async addSocketsToRoom(usersIds: string[], roomId: string): Promise<void> {
        const sockets = await this.findSocketsByUsers(usersIds)
        if (!sockets) throw new NotFoundException(`Failed to add sockets to game room. Sockets not found`)
        sockets.forEach(socket => {
            socket.join(roomId)
        })
    }

    async removeSocketFromRooms(userId: string): Promise<void> {
        const foundSocket = await this.findSocketByUser(userId)
        if (!foundSocket) throw new WsException({
            errorType: ErrorTypes.Internal,
            message: `Socket not found.`
        })

        const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
        allSocketRooms.forEach(room => foundSocket.leave(room))
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('start')
    async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)
        const foundUser = await this.usersService.getOrThrow(userId)

        const newGame = await this.gamesService.initGame(userId)

        const playersUsersIds = newGame.players.map(player => player.userId)
        const randomPlayerIndex = Math.floor(Math.random() * newGame.players.length)
 
        await Promise.all([
            this.gameTurnsService.create(newGame.game.id, newGame.players[randomPlayerIndex].id),
            this.addSocketsToRoom(playersUsersIds, newGame.game.id),
            foundUser.pregameRoomId ? this.pregameRoomsService.removeRoom({roomId: foundUser.pregameRoomId}) : null
        ])

        this.server.emit('games',{
            event: 'new-game',
            game: await this.gamesService.formatNewGame(newGame.game, newGame.players)
        })

        this.server.to(newGame.game.id).emit('games', {
            event: 'game-turn',
            turnOwner: await this.gamesService.formatPlayer(newGame.players[randomPlayerIndex]) 
        })
    }
}