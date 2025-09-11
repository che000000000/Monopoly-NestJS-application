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
import { Player, PlayerStatus } from "src/modules/players/model/player";
import { GamesFormatterService } from "src/modules/data-formatter/games/games-formatter.service";
import { Game } from "src/modules/games/model/game";
import { IGameState } from "src/modules/data-formatter/games/interfaces/game-state";
import { SendGameChatMessageDto } from "./dto/send-game-chat-message";
import { GetGameChatMessagesPageDto } from "./dto/get-game-chat-messages-page";
import { Message } from "src/modules/messages/model/message";
import { IGameChatMessageSender } from "src/modules/data-formatter/games/interfaces/game-chat-message-sender";
import { GetGamesPageDto } from "./dto/get-games-page";
import { GameFieldsService } from "src/modules/game-fields/game-fields.service";
import { IPlayer } from "src/modules/data-formatter/games/interfaces/player";
import { IGameField } from "src/modules/data-formatter/games/interfaces/game-field";
import { GamesMasterService } from "src/modules/games-master/games-master.service";
import { GameField, GameFieldType } from "src/modules/game-fields/model/game-field";
import { GameTurn, GameTurnStage } from "src/modules/game-turns/model/game-turn";

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
        private readonly gamesMasterService: GamesMasterService,
        private readonly usersService: UsersService,
        private readonly gamesService: GamesService,
        private readonly playersService: PlayersService,
        private readonly gamesFormatterService: GamesFormatterService,
        private readonly pregameRoomsGateway: PregameRoomsGateway,
        private readonly gameFiedlsService: GameFieldsService,
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

        const userPlayers = await this.playersService.findAllByUserId(userId)
        const currentPlayer = userPlayers.find((player: Player) => player.status !== PlayerStatus.IS_LEFT)
        if (!currentPlayer) return

        socket.join(currentPlayer.gameId)
    }

    private async turnTimeout(gameTurn: GameTurn): Promise<void> {
        const nextGameTurn = await this.gamesMasterService.defineNextGameTurn(gameTurn)

        this.startTurnTimer(nextGameTurn.gameTurn)
    }

    private async startTurnTimer(gameTurn: GameTurn): Promise<void> {
        await this.clearTurnTimer(gameTurn.id)

        const gameTurnPlayer = await this.playersService.getOneOrThrow(gameTurn.playerId)

        this.server.to(gameTurn.gameId).emit('new-game-turn', {
            gameTurn: this.gamesFormatterService.formatGameTurn(
                gameTurn,
                await this.getformattedPlayer(gameTurnPlayer)
            )
        })
        
        this.turnTimers.set(gameTurn.id, setTimeout(() => {
            this.turnTimeout(gameTurn)
        }, gameTurn.expires * 1000))
    }

    private async clearTurnTimer(gameTurnId: string): Promise<void> {
        const foundTimer = this.turnTimers.get(gameTurnId)
        if (!foundTimer) return

        clearTimeout(foundTimer)
        this.turnTimers.delete(gameTurnId)
    }

    private async getformattedPlayer(player: Player): Promise<IPlayer> {
        return this.gamesFormatterService.formatPlayer(player, await this.usersService.getOneOrThrow(player.userId))
    }

    private async getformattedPlayers(players: Player[]): Promise<IPlayer[]> {
        return await Promise.all(
            players.map(async (player: Player) => (
                this.gamesFormatterService.formatPlayer(player, await this.usersService.getOneOrThrow(player.userId))
            ))
        )
    }

    private async getFormattedGameField(gameField: GameField): Promise<IGameField> {
        const [ownerPlayer, players] = await Promise.all([
            gameField.ownerPlayerId ? this.playersService.getOneOrThrow(gameField.ownerPlayerId) : null,
            this.playersService.findAllByGameFieldId(gameField.id)
        ])

        const [formattedOwnerPlayer, formattedPlayers] = await Promise.all([
            ownerPlayer
                ? this.getformattedPlayer(ownerPlayer)
                : null,
            this.getformattedPlayers(players)
        ])

        return this.gamesFormatterService.formatGameField(gameField, formattedPlayers, formattedOwnerPlayer)
    }

    private async formatGameState(game: Game, players: Player[], gameFields: GameField[], gameTurn: GameTurn): Promise<IGameState> {
        const [formattedPlayers, formattedGameFields, formattedGameTurn] = await Promise.all([
            await this.getformattedPlayers(players),
            await Promise.all(
                gameFields.map(async (gameField: GameField) => {
                    const formattedGameFieldOwnerPlayer = gameField.ownerPlayerId
                        ? await this.getformattedPlayer(await this.playersService.getOneOrThrow(gameField.ownerPlayerId))
                        : null

                    const formattedGameFieldPlayers = await this.getformattedPlayers(await this.playersService.findAllByGameFieldId(gameField.id))
                    return this.gamesFormatterService.formatGameField(gameField, formattedGameFieldPlayers, formattedGameFieldOwnerPlayer)
                })
            ),
            (async () => {
                const turnPlayer = await this.playersService.getOneOrThrow(gameTurn.playerId)

                return this.gamesFormatterService.formatGameTurn(gameTurn, await this.getformattedPlayer(turnPlayer))
            })()
        ])

        return this.gamesFormatterService.formatGameState(game, formattedGameFields, formattedPlayers, formattedGameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('get-game-previews-page')
    async getGamePreviewsPage(
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
    async startGame(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const initGame = await this.gamesMasterService.initGame(userId)

        await Promise.all(
            initGame.players.map(async (player: Player) => {
                player.userId && await this.addSocketToRoom(player.userId, initGame.game.id)
            }))

        this.pregameRoomsGateway.emitRemovePregameRoom(initGame.pregameRoom)

        const formattedGameState = await this.formatGameState(initGame.game, initGame.players, initGame.gameFields, initGame.gameTurn)

        this.startTurnTimer(initGame.gameTurn)

        this.server.to(initGame.game.id).emit('start-game', {
            gameState: formattedGameState
        })

        this.server.emit('new-game', {
            game: this.gamesFormatterService.formatGame(initGame.game, formattedGameState.players)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('game-state')
    async getGameState(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const gameState = await this.gamesMasterService.getGameState(userId)

        socket.emit('game-state', {
            gameState: await this.formatGameState(gameState.game, gameState.players, gameState.gameFields, gameState.gameTurn)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('make-move')
    async makeMove(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const movePlayer = await this.gamesMasterService.makeMove(userId)

        const [formattedNewGameField, formattedLeftGameField] = await Promise.all([
            this.getFormattedGameField(movePlayer.newGameField),
            this.getFormattedGameField(movePlayer.leftGameField)
        ])

        this.server.to(movePlayer.game.id).emit('make-move', {
            player: this.gamesFormatterService.formatPlayer(
                movePlayer.player,
                await this.usersService.getOneOrThrow(movePlayer.player.userId)
            ),
            newGameField: formattedNewGameField,
            leftGameField: formattedLeftGameField,
            thrownDices: movePlayer.thrownDices
        })

        const purchasableTypes = [
            GameFieldType.PROPERTY,
            GameFieldType.RAILROAD,
            GameFieldType.UTILITY
        ]

        const canBuy = purchasableTypes.includes(movePlayer.newGameField.type) &&
            !movePlayer.newGameField.ownerPlayerId &&
            movePlayer.newGameField.basePrice

        canBuy
            ? await this.gameTurnsService.updateStage(movePlayer.gameTurn.id, GameTurnStage.BUY_GAME_FIELD)
            : await this.gameTurnsService.updateStage(movePlayer.gameTurn.id, GameTurnStage.PAY_RENT)

        const updatedGameTurn = await this.gameTurnsService.getOneOrThrow(movePlayer.gameTurn.id)

        setTimeout(async () => {
            await this.startTurnTimer(updatedGameTurn)
        }, 1000)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('game-chat-messages-page')
    async getGameChatMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetGameChatMessagesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 12
        }

        const gameChatMessagesPage = await this.gamesMasterService.getGameChatMessagesPage(userId, options.pageNumber, options.pageSize)

        const messagesWithFormattedSender = await Promise.all(
            gameChatMessagesPage.messagesList.reverse().map(async (message: Message) => {
                if (!message.userId) return {
                    message,
                    sender: null
                }

                const [user, player] = await Promise.all([
                    this.usersService.findOne(message.userId),
                    this.playersService.findCurrentPlayerByUserId(message.userId)
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
    async sendGameChatMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: SendGameChatMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendGameChatMessage = await this.gamesMasterService.sendGameChatMessage(userId, dto.messageText)
        const formattedGameChatMessageSender = this.gamesFormatterService.formatGameChatMessageSender(sendGameChatMessage.user, sendGameChatMessage.player)

        this.server.to(sendGameChatMessage.gameId).emit('send-game-chat-message', {
            message: this.gamesFormatterService.formatGameChatMessage(sendGameChatMessage.message, formattedGameChatMessageSender)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage(`buy-game-field`)
    async buyGameField(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const buyGameField = await this.gamesMasterService.buyGameField(userId)

        const nextGameTurn = await this.gamesMasterService.defineNextGameTurn(buyGameField.gameTurn)

        await this.startTurnTimer(nextGameTurn.gameTurn)

        const [formattedGameField, formattedPlayer] = await Promise.all([
            this.getFormattedGameField(buyGameField.gameField),
            this.getformattedPlayer(buyGameField.player)
        ])

        this.server.to(buyGameField.player.gameId).emit('buy-game-field', {
            gameField: formattedGameField,
            player: formattedPlayer
        })
    }
}