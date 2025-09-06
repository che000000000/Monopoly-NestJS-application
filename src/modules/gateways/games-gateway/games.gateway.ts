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
import { SendGameChatMessageDto } from "./dto/send-game-chat-message";
import { GetGameChatMessagesPageDto } from "./dto/get-game-chat-messages-page";
import { Message } from "src/models/message.model";
import { User } from "src/models/user.model";
import { IGameChatMessageSender } from "src/modules/data-formatter/games/interfaces/game-chat-message-sender";
import { GetGamesPageDto } from "./dto/get-games-page";

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
        const [formattedPlayers, formattedGameFields] = await Promise.all([
            await Promise.all(
                players.map(async (player: Player) => (
                    this.gamesFormatterService.formatPlayer(player, await this.usersService.getOneOrThrow(player.userId))
                ))
            ),
            await Promise.all(
                gameFields.map(async (gameField: GameField) => {
                    const formattedGameFieldOwnerPlayer = gameField.ownerPlayerId
                        ? this.gamesFormatterService.formatPlayer(
                            await this.playersService.getOneOrThrow(gameField.ownerPlayerId),
                            await this.usersService.getOneOrThrow((await this.playersService.getOneOrThrow(gameField.ownerPlayerId)).userId)
                        )
                        : null

                    const gameFieldPlayers = await this.playersService.findAllByGameFieldId(gameField.id)
                    const formattedGameFieldPlayers = await Promise.all(
                        gameFieldPlayers.map(async (player: Player) => (
                            this.gamesFormatterService.formatPlayer(player, await this.usersService.getOneOrThrow(player.userId))
                        ))
                    )
                    return this.gamesFormatterService.formatGameField(gameField, formattedGameFieldPlayers, formattedGameFieldOwnerPlayer)
                })
            )
        ])

        return this.gamesFormatterService.formatGameState(game, formattedGameFields, formattedPlayers)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('get-game-previews-page')
    private async getGamePreviewsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetGamesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const getGamesPage = await this.gamesService.getGamesPage()

        const formattedGamePrevies = await Promise.all(
            getGamesPage.gamesList.map(async (game: Game) => {
                const players = await this.playersService.findAllByGameId(game.id)
                const formattedPlayerPreviews = await Promise.all(
                    players.map(async (player: Player) => (
                        this.gamesFormatterService.formatPlayerPreview(player, await this.usersService.getOneOrThrow(player.userId))
                    ))
                )

                return this.gamesFormatterService.formatGamePreview(game, formattedPlayerPreviews)
            })
        )

        socket.emit('get-game-previews-page', {
            gamePreviewsList: formattedGamePrevies,
            totalCount: getGamesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('start-game')
    private async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const initGame = await this.gamesService.initGame(userId)

        await Promise.all(
            initGame.players.map(async (player: Player) => {
                player.userId && await this.addSocketToRoom(player.userId, initGame.game.id)
            }))

        this.pregameRoomsGateway.emitRemovePregameRoom(initGame.pregameRoom)

        const formattedGameState = await this.formatGameState(initGame.game, initGame.players, initGame.gameFields)

        this.server.to(initGame.game.id).emit('start-game', {
            gameState: formattedGameState
        })

        this.server.emit('new-game', {
            game: this.gamesFormatterService.formatGame(initGame.game, formattedGameState.players)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('game-state')
    private async getGameState(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const gameState = await this.gamesService.getGameState(userId)

        socket.emit('game-state', {
            gameState: await this.formatGameState(gameState.game, gameState.players, gameState.gameFields)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('game-chat-messages-page')
    private async getGameChatMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetGameChatMessagesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 12
        }

        const gameChatMessagesPage = await this.gamesService.getGameChatMessagesPage(userId, options.pageNumber, options.pageSize)

        const messagesWithFormattedSender = await Promise.all(
            gameChatMessagesPage.messagesList.reverse().map(async (message: Message) => {
                if (!message.userId) return {
                    message,
                    sender: null
                }

                const [user, player] = await Promise.all([
                    this.usersService.findOne(message.userId),
                    this.playersService.findOneByUserId(message.userId)
                ])

                return {
                    message,
                    sender: user && player
                        ? this.gamesFormatterService.formatGameChatMessageSender(user, player)
                        : null
                }
            })
        )

        socket.emit('game-chat-messages-page', {
            messagesList: messagesWithFormattedSender.map((messageWithSender: { message: Message, sender: IGameChatMessageSender | null }) => (
                this.gamesFormatterService.formatGameChatMessage(
                    messageWithSender.message,
                    messageWithSender.sender
                ))),
            totalCount: gameChatMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-game-chat-message')
    private async sendGameChatMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: SendGameChatMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendGameChatMessage = await this.gamesService.sendGameChatMessage(userId, dto.messageText)
        const formattedGameChatMessageSender = this.gamesFormatterService.formatGameChatMessageSender(sendGameChatMessage.user, sendGameChatMessage.player)

        this.server.to(sendGameChatMessage.gameId).emit('send-game-chat-message', {
            message: this.gamesFormatterService.formatGameChatMessage(sendGameChatMessage.message, formattedGameChatMessageSender)
        })
    }
}