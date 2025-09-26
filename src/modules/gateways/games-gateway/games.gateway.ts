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
import { ActionCard } from "src/modules/action-cards/model/action-card";
import { GamePayment } from "src/modules/game-payments/model/game-payment";

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

    private async startTurnTimer(gameTurn: GameTurn, gamePayment?: GamePayment, actionCard?: ActionCard): Promise<void> {
        await this.clearTurnTimer(gameTurn.id)

        const gameTurnPlayer = await this.playersService.getOneOrThrow(gameTurn.playerId)

        this.server.to(gameTurn.gameId).emit('new-game-turn', {
            gameTurn: this.gamesFormatterService.formatGameTurn(
                gameTurn,
                await this.getformattedPlayer(gameTurnPlayer),
                actionCard ? this.gamesFormatterService.formatActionCard(actionCard) : undefined,
                gamePayment ? this.gamesFormatterService.formatGamePayment(gamePayment) : undefined
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

    private async formatGameState(game: Game, players: Player[], gameFields: GameField[], gameTurn: GameTurn, actionCard?: ActionCard, gamePayment?: GamePayment): Promise<IGameState> {
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

                return this.gamesFormatterService.formatGameTurn(
                    gameTurn,
                    await this.getformattedPlayer(turnPlayer),
                    actionCard ? this.gamesFormatterService.formatActionCard(actionCard) : undefined,
                    gamePayment ? this.gamesFormatterService.formatGamePayment(gamePayment) : undefined
                )
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
            gameState: await this.formatGameState(
                gameState.game, gameState.players, gameState.gameFields, gameState.gameTurn,
                gameState.actionCard
                    ? gameState.actionCard
                    : undefined
            )
        })
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

        const processHitGameFiled = await this.gamesMasterService.processHitGameFiled(movePlayer.player, movePlayer.newGameField, movePlayer.gameTurn)

        setTimeout(async () => {
            await this.startTurnTimer(processHitGameFiled.gameTurn, processHitGameFiled.gamePayment ?? undefined, processHitGameFiled.actionCard ?? undefined)
        }, 1000)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('buy-game-field')
    async payGamePayment(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const buyGameField = await this.gamesMasterService.buyGameField(userId)

        const [formattedPlayer, formattedGameField] = await Promise.all([
            this.getformattedPlayer(buyGameField.player),
            this.getFormattedGameField(buyGameField.gameField)
        ])

        let nextGameTurn: GameTurn | null = buyGameField.gameTurn
        if (buyGameField.gameTurn.isDouble) {
            nextGameTurn = await this.gameTurnsService.updateOne(buyGameField.gameTurn.id, { stage: GameTurnStage.MOVE })
            if (!nextGameTurn) {
                throw new Error(`Failed to define next turn. Game turn was not updated.`)
            }
        } else {
            nextGameTurn = (await this.gamesMasterService.defineNextGameTurn(buyGameField.gameTurn)).gameTurn
        }

        this.server.to(buyGameField.player.gameId).emit('buy-game-field', {
            player: formattedPlayer,
            gameField: formattedGameField
        })

        setTimeout(async () => {
            await this.startTurnTimer(nextGameTurn)
        }, 500)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pay-rent')
    async payRent(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const payRent = await this.gamesMasterService.payRent(userId)

        const [payingPlayer, getPaymentPlayer] = await Promise.all([
            this.getformattedPlayer(payRent.payingPlayer),
            this.getformattedPlayer(payRent.getPaymentPlayer)
        ])

        let nextGameTurn: GameTurn | null = payRent.gameTurn
        if (payRent.gameTurn.isDouble) {
            nextGameTurn = await this.gameTurnsService.updateOne(payRent.gameTurn.id, { stage: GameTurnStage.MOVE })
            if (!nextGameTurn) {
                throw new Error(`Failed to define next turn. Game turn was not updated.`)
            }
        } else {
            nextGameTurn = (await this.gamesMasterService.defineNextGameTurn(payRent.gameTurn)).gameTurn
        }

        this.server.to(payRent.gameTurn.gameId).emit('pay-rent', {
            payingPlayer,
            getPaymentPlayer
        })

        setTimeout(async () => {
            await this.startTurnTimer(nextGameTurn)
        }, 500)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pay-tax')
    async payTax(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const payTax = await this.gamesMasterService.payTax(userId)

        let nextGameTurn: GameTurn | null = payTax.gameTurn
        if (payTax.gameTurn.isDouble) {
            nextGameTurn = await this.gameTurnsService.updateOne(payTax.gameTurn.id, { stage: GameTurnStage.MOVE })
            if (!nextGameTurn) {
                throw new Error(`Failed to define next turn. Game turn was not updated.`)
            }
        } else {
            nextGameTurn = (await this.gamesMasterService.defineNextGameTurn(payTax.gameTurn)).gameTurn
        }

        this.server.to(payTax.gameTurn.gameId).emit('pay-tax', {
            player: await this.getformattedPlayer(payTax.player),
        })

        setTimeout(async () => {
            await this.startTurnTimer(nextGameTurn)
        }, 500)
    }
}