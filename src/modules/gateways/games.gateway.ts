import { UseFilters } from "@nestjs/common";
import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { Server } from "socket.io";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsGateway } from "./pregame-rooms.gateway";
import { UsersService } from "../users/users.service";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { GamesService } from "../games/games.service";
import { PlayersService } from "../players/players.service";
import { GameTurnsService } from "../game-turns/game-turns.service";

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
        private readonly playersService: PlayersService,
        private readonly pregameGateway: PregameRoomsGateway,
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly gameTurnsService: GameTurnsService
    ) { }

    private turnTimers: Map<string, NodeJS.Timeout> = new Map()

    @WebSocketServer()
    server: Server

    // extractUserId(socket: SocketWithSession): string {
    //     const exctractedUserId = socket.request.session.userId
    //     if (!exctractedUserId) {
    //         throw new InternalServerErrorException(`UserId doesn't extracted.`)
    //     }
    //     return exctractedUserId
    // }

    // private async findSocketByUser(userId: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
    //     const allSockets = await this.server.fetchSockets()
    //     return allSockets.find(socket => socket.data.userId === userId)
    // }

    // private async findSocketsByUsers(usersIds: string[]): Promise<RemoteSocket<DefaultEventsMap, any>[] | undefined> {
    //     const allSockets = await this.server.fetchSockets()
    //     return allSockets.filter(socket => usersIds.includes(socket.data.userId))
    // }

    // private async addSocketsToRoom(usersIds: string[], roomId: string): Promise<void> {
    //     const sockets = await this.findSocketsByUsers(usersIds)
    //     if (!sockets) throw new NotFoundException(`Failed to add sockets to game room. Sockets not found`)
    //     sockets.forEach(socket => {
    //         socket.join(roomId)
    //     })
    // }

    // async removeSocketFromRooms(userId: string): Promise<void> {
    //     const foundSocket = await this.findSocketByUser(userId)
    //     if (!foundSocket) throw new WsException({
    //         errorType: ErrorTypes.Internal,
    //         message: `Socket not found.`
    //     })

    //     const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
    //     allSocketRooms.forEach(room => foundSocket.leave(room))
    // }

    // private async turnTimeout(gameTurn: GameTurn, currentPlayer: Player): Promise<void> {
    //     const [game, nextTurnOwnerPlayer] = await Promise.all([
    //         this.gamesService.getOrThrow(gameTurn.gameId),
    //         this.gamesService.getNextPlayer(currentPlayer)
    //     ])

    //     const setGameTurn = await this.gamesService.setTurn(gameTurn, nextTurnOwnerPlayer)

    //     await this.removePlayer(currentPlayer, 'Turn timeout.')

    //     const remainingPlayers = await this.gamesService.getGamePlayers(game)
    //     if (remainingPlayers.length < 2) {
    //         this.endGame(game)
    //         this.removeTurnTimer(gameTurn)
    //     } else {
    //         this.startTurnTimer(game, setGameTurn.owner)
    //     }
    // }

    // private async startTurnTimer(game: Game, player: Player) {
    //     const gameTurn = await this.gameTurnsService.getByGameOrThrow(game)

    //     this.removeTurnTimer(gameTurn)

    //     const turnTimer = setTimeout(() => {
    //         this.turnTimeout(gameTurn, player)
    //     }, gameTurn.expires * 1000)

    //     this.turnTimers.set(gameTurn.id, turnTimer)

    //     const turnOwnerUser = await this.usersService.getOrThrow(player.userId)
    //     this.server.to(gameTurn.gameId).emit('games', {
    //         event: 'turn-timer',
    //         gameTurn: formatGameTurn(gameTurn, formatPlayer(player, turnOwnerUser))
    //     })
    // }

    // private removeTurnTimer(gameTurn: GameTurn): void {
    //     const turnTimer = this.turnTimers.get(gameTurn.id)
    //     if (turnTimer) {
    //         clearTimeout(turnTimer)
    //         this.turnTimers.delete(gameTurn.id)
    //     }
    // }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return
    }

    // async removePlayer(player: Player, reason: string): Promise<Player> {
    //     const [playerAsUser, game] = await Promise.all([
    //         this.usersService.getOrThrow(player.userId),
    //         this.gamesService.getOrThrow(player.gameId),
    //         this.gamesService.removePlayerFromGame(player),
    //         this.removeSocketFromRooms(player.userId)
    //     ])

    //     this.server.emit('games', {
    //         event: 'left-user',
    //         leftPlayer: formatPlayer(player, playerAsUser),
    //         from: formatCommonGame(game),
    //         reason
    //     })

    //     return player
    // }

    // async endGame(game: Game): Promise<Player> {
    //     const [winnerPlayer, gameTurn] = await Promise.all([
    //         this.gamesService.endGame(game),
    //         this.gameTurnsService.getByGameOrThrow(game)
    //     ])

    //     const [winnerPlayerAsUser] = await Promise.all([
    //         this.usersService.getOrThrow(winnerPlayer.userId),
    //         this.removeSocketFromRooms(winnerPlayer.userId)
    //     ])

    //     this.removeTurnTimer(gameTurn)

    //     this.server.emit('games', {
    //         event: 'game-end',
    //         game: formatCommonGame(game),
    //         winner: formatPlayer(winnerPlayer, winnerPlayerAsUser)
    //     })

    //     return winnerPlayer
    // }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('start')
    // async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
    //     const userId = this.extractUserId(socket)

    //     const pregameRoom = await this.pregameRoomsService.findByUser(userId)
    //     if (!pregameRoom) throw new BadRequestException(`Failed to create game. User isn't in the pregame room.`)
    //     if (pregameRoom.ownerId !== userId) throw new BadRequestException(`Failed to create game. User isn't owner of the pregame room.`)

    //     const newGame = await this.gamesService.initGame(userId)

    //     const playersUsersIds = newGame.players.map(player => player.userId)
    //     await Promise.all([
    //         this.addSocketsToRoom(playersUsersIds, newGame.game.id),
    //         pregameRoom ? await this.pregameGateway.removePregameRoom(pregameRoom) : null
    //     ])

    //     const formattedPlayers = await Promise.all(
    //         newGame.players.map(async (player) => {
    //             const playerUser = await this.usersService.getOrThrow(player.userId)
    //             return formatPlayer(player, playerUser)
    //         })
    //     )

    //     const formattedGameWithPlayers = formatGameWithPlayers(newGame.game, formattedPlayers)
    //     this.server.emit('games', {
    //         event: 'new-game',
    //         game: formattedGameWithPlayers
    //     })

    //     const gameTurnWithOwner = await this.gamesService.getTurnWithPlayer(newGame.game)
    //     this.startTurnTimer(newGame.game, gameTurnWithOwner.player)
    // }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('move')
    // async makeMove(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
    //     const userId = this.extractUserId(socket)

    //     const [player, playerAsUser] = await Promise.all([
    //         this.playersService.findByUserId(userId),
    //         this.usersService.getOrThrow(userId),
    //     ])
    //     if (!player) throw new BadRequestException(`Failed to make move. User not in the game.`)

    //     const [moveResult, game] = await Promise.all([
    //         this.gamesService.movePlayer(player),
    //         this.gamesService.getOrThrow(player.gameId)
    //     ])

    //     this.server.to(moveResult.player.gameId).emit('games', {
    //         event: 'move',
    //         player: formatPlayer(moveResult.player, playerAsUser),
    //         onField: formatGameField(moveResult.gameField, player, playerAsUser),
    //         thrownDices: { thrownDices: moveResult.dices, summ: moveResult.summ, isDouble: moveResult.isDouble },
    //     })

    //     if (!moveResult.isDouble) {
    //         const nextTurnOwnerPlayer = await this.gamesService.getNextPlayer(player)
    //         await this.startTurnTimer(game, nextTurnOwnerPlayer)
    //     }
    // }
}