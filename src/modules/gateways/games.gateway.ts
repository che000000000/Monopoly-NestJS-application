import { InternalServerErrorException, NotFoundException, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { ErrorTypes } from "./constants/error-types";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameGateway } from "./pregame.gateway";
import { UsersService } from "../users/users.service";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { GamesService } from "../games/games.service";
import { Game } from "src/models/game.model";
import { User } from "src/models/user.model";
import { Player } from "src/models/player.model";
import { formatPlayer } from "./formatters/games/player";
import { formatCommonGame, formatGameWithPlayers } from "./formatters/games/game";
import { formatGameTurn } from "./formatters/games/game-turn";
import { GameTurn } from "src/models/game-turn.model";

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
        private readonly pregameGateway: PregameGateway,
        private readonly usersService: UsersService,
        private readonly gamesService: GamesService,
        private readonly pregameRoomsService: PregameRoomsService
    ) { }

    private turnTimers: Map<string, NodeJS.Timeout> = new Map()

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

    private async turnTimeout(gameTurn: GameTurn, currentPlayer: Player): Promise<void> {
        const nextTurnOwnerPlayer = await this.gamesService.getNextPlayer(currentPlayer)
        const setGameTurn = await this.gamesService.setTurn(gameTurn, nextTurnOwnerPlayer)

        this.startTurnTimer(setGameTurn.gameTurn, setGameTurn.owner)
    }

    private async startTurnTimer(gameTurn: GameTurn, player: Player) {
        this.removeTurnTimer(gameTurn)

        const turnTimer = setTimeout(() => {
            this.turnTimeout(gameTurn, player)
        }, gameTurn.expires * 1000)

        this.turnTimers.set(gameTurn.id, turnTimer)

        const turnOwnerUser = await this.usersService.getOrThrow(player.userId)
        this.server.to(gameTurn.gameId).emit('games', {
            event: 'new-game-turn',
            gameTurn: formatGameTurn(gameTurn, formatPlayer(player, turnOwnerUser)) 
        })
    }

    private removeTurnTimer(gameTurn: GameTurn): void {
        const turnTimer = this.turnTimers.get(gameTurn.id)
        if (turnTimer) this.turnTimers.delete(gameTurn.id)
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('start')
    async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)
        const pregameRoom = await this.pregameRoomsService.findByUser(userId)

        const newGame = await this.gamesService.initGame(userId)

        const playersUsersIds = newGame.players.map(player => player.userId)
        await Promise.all([
            this.addSocketsToRoom(playersUsersIds, newGame.game.id),
            pregameRoom ? await this.pregameGateway.removePregameRoom(pregameRoom) : null
        ])

        const formattedPlayers = await Promise.all(
            newGame.players.map(async (player) => {
                const playerUser = await this.usersService.getOrThrow(player.userId)
                return formatPlayer(player, playerUser)
            })
        )

        const formattedGameWithPlayers = formatGameWithPlayers(newGame.game, formattedPlayers) 
        this.server.emit('games',{
            event: 'new-game',
            game: formattedGameWithPlayers
        })

        const gameTurnWithOwner = await this.gamesService.getTurnWithPlayer(newGame.game)
        this.startTurnTimer(gameTurnWithOwner.gameTurn, gameTurnWithOwner.player)
    }
}