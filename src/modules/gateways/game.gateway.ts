import { BadRequestException, NotFoundException, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { GamesService } from "../games/games.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { ErrorTypes } from "./constants/error-types";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameGateway } from "./pregame.gateway";
import { RemovePlayer } from "./dto/game/remove-player.dto";
import { PlayersService } from "../players/players.service";
import { RemovePlayerSocket } from "./dto/game/remove-player-socket.dto";
import { emit } from "process";
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
        private readonly gamesService: GamesService,
        private readonly usersService: UsersService,
        private readonly pregameGamteway: PregameGateway,
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

    private async findSocketById(userId: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.find(socket => socket.data.userId === userId)
    }

    async removeSocketFromRooms(dto: RemovePlayerSocket): Promise<void> {
        const foundSocket = await this.findSocketById(dto.playerId)
        if (!foundSocket) throw new WsException({
            errorType: ErrorTypes.Internal,
            message: `Socket not found.`
        })

        const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
        allSocketRooms.forEach(room => foundSocket.leave(room))
    }

    async joinSocketsToGame(gameId: string): Promise<void> {
        const [gameUsers] = await Promise.all([
            this.usersService.findGameUsers(gameId)
        ])

        const gameSockets = await Promise.all(
            gameUsers.map(async (user) => {
                return this.findSocketById(user.id)
            })
        )

        gameSockets.map(socket => socket?.join(gameId))
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if(!userId) {
            socket.disconnect()
            return
        }
    }

    async removePlayer(dto: RemovePlayer): Promise<void> {
        const foundPlayer = await this.playersService.findPlayer(dto.playerId)
        if (!foundPlayer) throw new NotFoundException(`Failed to remove. Player not found`)

        const playerGame = await this.gamesService.getGame(foundPlayer.gameId)

        await Promise.all([
            this.playersService.destroyPlayer({
                playerId: foundPlayer.id
            }),
            this.removeSocketFromRooms({
                playerId: foundPlayer.id
            })
        ])

        this.server.emit('games', {
            event: 'remove-player',
            removedPlayer: foundPlayer,
            game: playerGame
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('start')
    async startGame(@ConnectedSocket() socket: SocketWithSession) {
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

        await this.joinSocketsToGame(newGame.game.id)

        this.server.emit('games', {
            event: 'new-game',
            newGame
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('move')
    async takeTurn(
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const userId = this.extractUserId(socket)

        const [userAsPlayer, foundGame] = await Promise.all([
            this.playersService.findPlayerByUser(userId),
            this.gamesService.findGameByUser(userId)
        ])
        if (!userAsPlayer || !foundGame) throw new BadRequestException(`User not in the game.`)

        const newTurnOwner = await this.gamesService.nextTurn({
            gameId: foundGame.id,
            playerId: userAsPlayer.id
        })

        this.server.to(foundGame.id).emit('games', {
            event: 'take',
            newTurnOwner
        })
    }
}