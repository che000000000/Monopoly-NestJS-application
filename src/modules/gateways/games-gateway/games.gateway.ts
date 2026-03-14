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
import { SendGameChatMessageDto } from "./dto/send-game-chat-message";
import { GetGameChatMessagesPageDto } from "./dto/get-game-chat-messages-page";
import { GetGamesPageDto } from "./dto/get-games-page";
import { GamesMasterService } from "src/modules/games-master/games-master.service";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { GameTurnsFormatterService } from "src/modules/data-formatter/game-turns/game-turns-formatter.service";
import { GamePaymentsFormatterService } from "src/modules/data-formatter/game-payments/game-payments-formatter.service";
import { ActionCardsFormatterService } from "src/modules/data-formatter/action-cards/action-cards-formatter.service";
import { GameFieldsFormatterService } from "src/modules/data-formatter/game-fields/game-fields-formatter.service";
import { GameChatFormatterService } from "src/modules/data-formatter/game-chat/game-chat-formatter.service";
import { PayPaymentDto } from "./dto/pay-payment";
import { PlayersFormatterService } from "src/modules/data-formatter/players/players-formatter.service";

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
        private readonly gamesService: GamesService,
        private readonly playersService: PlayersService,
        private readonly pregameRoomsGateway: PregameRoomsGateway,
        private readonly gamesFormatterService: GamesFormatterService,
        private readonly playersFormatterService: PlayersFormatterService,
        private readonly gameTurnsFormatterService: GameTurnsFormatterService,
        private readonly gameFieldsFormatterService: GameFieldsFormatterService,
        private readonly gameChatFormatterService: GameChatFormatterService
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
        const nextGameTurn = await this.gamesMasterService.passGameTurnToNextPlayer(gameTurn)

        this.startTurnTimer(nextGameTurn)
    }

    private async startTurnTimer(gameTurn: GameTurn): Promise<void> {
        await this.clearTurnTimer(gameTurn)

        this.turnTimers.set(gameTurn.gameId, setTimeout(() => {
            this.turnTimeout(gameTurn)
        }, gameTurn.expires * 1000))

        this.server.to(gameTurn.gameId).emit('set-game-turn',
            await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurn)
        )
    }

    private async clearTurnTimer(gameTurn: GameTurn): Promise<void> {
        const turnTimer = this.turnTimers.get(gameTurn.gameId)
        if (!turnTimer) return

        clearTimeout(turnTimer)
        this.turnTimers.delete(gameTurn.gameId)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('get-game-previews-page')
    async getGamePreviewsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetGamesPageDto
    ): Promise<void> {
        const getGamesPage = await this.gamesService.getGamesPage()

        const formattedGamePrevies = await Promise.all(
            getGamesPage.gamesList.map(async (game: Game) =>
                this.gamesFormatterService.formatGamePreviewAsync(game)
            )
        )

        socket.emit('game-previews-page', {
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

        this.startTurnTimer(initGame.gameTurn)

        this.server.to(initGame.game.id).emit('start-game',
            await this.gamesFormatterService.formatGameStateAsync(initGame.game)
        )

        this.server.emit('new-game',
            await this.gamesFormatterService.formatGamePreviewAsync(initGame.game)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('game-state')
    async getGameState(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to get game state. User not in the game as player.`)
        }

        const game = await this.gamesService.getOneOrThrow(player.gameId)

        socket.emit('game-state',
            await this.gamesFormatterService.formatGameStateAsync(game)
        )
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

        socket.emit('game-chat-messages-page', {
            messagesList: await this.gameChatFormatterService.formatGameChatMessagesAsync(gameChatMessagesPage.messagesList),
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

        this.server.to(sendGameChatMessage.gameId).emit('game-chat-message', 
            await this.gameChatFormatterService.formatGameChatMessageAsync(sendGameChatMessage.message)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('make-move')
    async makeMove(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameId, gameTurn, player, leftGameField, newGameField, thrownDices } = await this.gamesMasterService.makeMove(userId)

        this.server.to(gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurn)
        ))
        this.server.to(gameId).emit('throw-dices', (
            thrownDices
        ))

        setTimeout(async () => {
            this.startTurnTimer(await this.gamesMasterService.handlePlayerHitGameFieled(player, newGameField, gameTurn))
            this.server.to(gameId).emit('make-move', {
                player: await this.playersFormatterService.formatPlayerAsync(player),
                gameFields: await this.gameFieldsFormatterService.formatGameFieldsAsync([leftGameField, newGameField])
            })
        }, 1000)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('accept-payment')
    async acceptPayment(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: PayPaymentDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameId, gameTurn, players, gameFields } = await this.gamesMasterService.executePayment(userId, dto.paymentId)

        this.server.to(gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync(players)
        ))
        this.server.to(gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync(gameFields)
        ))

        if (gameTurn) {
            this.startTurnTimer(gameTurn)
        }
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('accept-forced-move')
    async acceptForcedMove(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, player, leftGameField, newGameField} = await this.gamesMasterService.executeForcedMove(userId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            [await this.playersFormatterService.formatPlayerAsync(player)]
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync([leftGameField, newGameField])
        ))

        this.startTurnTimer(await this.gamesMasterService.handlePlayerHitGameFieled(player, newGameField, gameTurn))
    }
}