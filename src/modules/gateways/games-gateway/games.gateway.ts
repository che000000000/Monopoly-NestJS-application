import { BadRequestException, InternalServerErrorException, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { SocketWithSession } from "../interfaces/socket-with-session.interface";
import { UsersService } from "../../users/users.service";
import { GamesService } from "../../games/games.service";
import { PlayersService } from "../../players/players.service";
import { GameTurnsService } from "../../game-turns/game-turns.service";
import { WsAuthGuard } from "../guards/wsAuth.guard";
import { PregameRoomsGateway } from "../pregame-rooms-gateway/pregame-rooms.gateway";
import { ErrorType } from "../constants/error-types";
import { Player } from "src/models/player.model";
import { GamesFormatterService } from "src/modules/data-formatter/games/games-formatter.service";
import { GameField } from "src/models/game-field.model";
import { GetGameStateDto } from "./dto/get-game-state";
import { Game } from "src/models/game.model";
import { IGameState } from "src/modules/data-formatter/games/interfaces/game-state";

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
        private readonly gamesFormatterService: GamesFormatterService,
        private readonly pregameRoomsGateway: PregameRoomsGateway,
        private readonly gameTurnsService: GameTurnsService
    ) { }

    private turnTimers: Map<string, NodeJS.Timeout> = new Map()

    @WebSocketServer()
    server: Server

    extractUserId(socket: SocketWithSession): string {
        const exctractedUserId = socket.request.session.userId
        if (!exctractedUserId) {
            throw new InternalServerErrorException(`Failed to extract userId.`)
        }
        return exctractedUserId
    }

    private async findSocketByUserId(userId: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.find(socket => socket.data.userId === userId)
    }

    private async addSocketToRoom(userId: string, roomId: string): Promise<void> {
        const socket = await this.findSocketByUserId(userId)
        if (!socket) return
        socket.join(roomId)
    }

    async removeSocketFromRooms(userId: string): Promise<void> {
        const foundSocket = await this.findSocketByUserId(userId)
        if (!foundSocket) throw new WsException({
            errorType: ErrorType.INTERNAL,
            message: `Socket not found.`
        })

        const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
        allSocketRooms.forEach(room => foundSocket.leave(room))
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const player = await this.playersService.findOneByUserId(userId)
        if (!player) return

        socket.join(player.gameId)
    }

    private async formatGameState(game: Game, players: Player[], gameFields: GameField[]): Promise<IGameState> {
        const playersWithUsers = await Promise.all(
            players.map(async (player: Player) => {
                const playerAsUser = await this.usersService.findOne(player.userId)
                return {
                    player,
                    user: playerAsUser ? playerAsUser : null
                }
            })
        )

        const [formattedPlayers, formattedGameFields] = await Promise.all([
            playersWithUsers.map(playerWithUser => this.gamesFormatterService.formatPlayer(playerWithUser.player, playerWithUser.user)),
            await Promise.all(
                gameFields.map(async (gameField: GameField) => {
                    const ownerPlayer = gameField.ownerPlayerId ? await this.playersService.getOneOrThrow(gameField.ownerPlayerId) : null
                    const ownerPlayerWithUser = ownerPlayer
                        ? {
                            player: ownerPlayer,
                            user: await this.usersService.findOne(ownerPlayer.userId)
                        }
                        : null
                    const formattedGameFieldOwnerPlayer = ownerPlayerWithUser ? this.gamesFormatterService.formatPlayer(ownerPlayerWithUser.player, ownerPlayerWithUser.user) : null

                    const gameFieldPlayers = await this.playersService.findAllByGameFieldId(gameField.id)
                    const gameFieldPlayersWithUsers = await Promise.all(
                        gameFieldPlayers.map(async (player: Player) => ({
                            player,
                            user: await this.usersService.findOne(player.userId)
                        }))
                    )
                    const formattedGameFieldPlayers = gameFieldPlayersWithUsers.map(playerWithUser => (
                        this.gamesFormatterService.formatPlayer(playerWithUser.player, playerWithUser.user)
                    ))

                    return this.gamesFormatterService.formatGameField(gameField, formattedGameFieldPlayers, formattedGameFieldOwnerPlayer)
                })
            )
        ])

        return this.gamesFormatterService.formatGameState(game, formattedGameFields, formattedPlayers)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('start-game')
    private async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const initGame = await this.gamesService.initGame(userId)

        await Promise.all(
            initGame.players.map(async (player: Player) => await this.addSocketToRoom(player.userId, initGame.game.id))
        )

        this.pregameRoomsGateway.emitRemovePregameRoom(initGame.pregameRoom)

        const formattedGameState = await this.formatGameState(initGame.game, initGame.players, initGame.gameFields)

        this.server.to(initGame.game.id).emit('game-state', {
            gameState: formattedGameState
        })

        this.server.emit('new-game', {
            game: this.gamesFormatterService.formatGame(initGame.game, formattedGameState.players)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('get-game-state')
    private async getGameState(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetGameStateDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const userAsPlayer = await this.playersService.findOneByUserId(userId)

        let gameId = userAsPlayer?.gameId || dto.gameId
        if (!gameId) {
            throw new BadRequestException('Failed to get game state. User is not in the game or gameId was not provided.')
        }

        const gameState = await this.gamesService.getGameState(gameId)

        socket.emit('game-state', {
            gameState: await this.formatGameState(gameState.game, gameState.players, gameState.gameFields)
        })
    }
}