import { BadRequestException, InternalServerErrorException, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { SocketWithSession } from "../interfaces/socket-with-session.interface";
import { GamesService } from "../../games/games.service";
import { PlayersService } from "../../players/players.service";
import { WsAuthGuard } from "../guards/wsAuth.guard";
import { PregameRoomsGateway } from "../pregame-rooms-gateway/pregame-rooms.gateway";
import { ErrorType } from "../constants/error-types";
import { Player } from "src/modules/players/model/player";
import { GamesFormatterService } from "src/modules/data-formatter/games/games-formatter.service";
import { Game } from "src/modules/games/model/game";
import { SendGameChatMessageDto } from "./dto/send-game-chat-message";
import { GetGameChatMessagesPageDto } from "./dto/get-game-chat-messages-page";
import { GetGamesPageDto } from "./dto/get-games-page";
import { GamesMasterService } from "src/modules/games-master/games-master.service";
import { GameTurn, GameTurnStage } from "src/modules/game-turns/model/game-turn";
import { GameTurnsFormatterService } from "src/modules/data-formatter/game-turns/game-turns-formatter.service";
import { GameFieldsFormatterService } from "src/modules/data-formatter/game-fields/game-fields-formatter.service";
import { GameChatFormatterService } from "src/modules/data-formatter/game-chat/game-chat-formatter.service";
import { PlayersFormatterService } from "src/modules/data-formatter/players/players-formatter.service";
import { ActionCardsService } from "src/modules/action-cards/action-cards.service";
import { ActionCardType } from "src/modules/action-cards/model/action-card";
import { PayThePaymentDto } from "./dto/pay-the-payment";
import { BuildOnTheFieldDto } from "./dto/build-on-the-field";

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
        private readonly actionCardsService: ActionCardsService,
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

        const currentPlayer = await this.playersService.findActivePlayerByUserId(userId)
        if (!currentPlayer) return

        socket.join(currentPlayer.gameId)
    }

    private async handleActionCardTimeout(gameTurn: GameTurn): Promise<void> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to handle actionCard timeout. gameTurn: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)

        switch (actionCard.type) {
            case ActionCardType.MOVE: {
                const { movingGameTurn, player, fromGameField, toGameField } = await this.gamesMasterService.executeMoveActionCardRequirement(gameTurn)

                this.server.to(movingGameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(movingGameTurn)
                ))
                this.server.to(movingGameTurn.gameId).emit('update-players', (
                    [await this.playersFormatterService.formatPlayerAsync(player)]
                ))
                this.server.to(movingGameTurn.gameId).emit('update-game-fields', (
                    await this.gameFieldsFormatterService.formatGameFieldsAsync([
                        fromGameField,
                        toGameField
                    ])
                ))

                this.startTurnTimer(movingGameTurn)
                break
            }
            case ActionCardType.GO_TO_JAIL: {
                const { movingToJailGameTurn, player, gameFields } = await this.gamesMasterService.executeGoToJailActionCardRequirement(gameTurn)

                this.server.to(movingToJailGameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(movingToJailGameTurn)
                ))
                this.server.to(movingToJailGameTurn.gameId).emit('update-players', (
                    await this.playersFormatterService.formatPlayersAsync([player])
                ))
                this.server.to(movingToJailGameTurn.gameId).emit('update-game-fields', (
                    await this.gameFieldsFormatterService.formatGameFieldsAsync(gameFields)
                ))

                this.startTurnTimer(movingToJailGameTurn)
                break
            }
            case ActionCardType.GET_MONEY: {
                const actionCardExecuteResult = await this.gamesMasterService.executeGetMoneyActionCardRequirement(gameTurn)

                this.server.to(gameTurn.gameId).emit('update-players', (
                    await this.playersFormatterService.formatPlayersAsync([actionCardExecuteResult.player])
                ))
                this.server.to(gameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(actionCardExecuteResult.gameTurn)
                ))

                const nextGameTurn = gameTurn.isDouble
                    ? await this.gamesMasterService.grantExtraTurn(actionCardExecuteResult.gameTurn)
                    : await this.gamesMasterService.passGameTurnToNextPlayer(actionCardExecuteResult.gameTurn)
                this.startTurnTimer(nextGameTurn)
                break
            }
            case ActionCardType.GET_OUT_OF_JAIL: {
                const actionCardExecuteResult = await this.gamesMasterService.executeGetOutOfJailActionCardRequirement(gameTurn)

                this.server.to(gameTurn.gameId).emit('update-players', (
                    await this.playersFormatterService.formatPlayersAsync([actionCardExecuteResult.player])
                ))

                const nextGameTurn = gameTurn.isDouble
                    ? await this.gamesMasterService.grantExtraTurn(actionCardExecuteResult.gameTurn)
                    : await this.gamesMasterService.passGameTurnToNextPlayer(actionCardExecuteResult.gameTurn)

                this.startTurnTimer(nextGameTurn)
                break
            }
            case ActionCardType.PAY_MONEY: {
                const gameTurnWithActionCardRequirements = await this.gamesMasterService.preparePayMoneyActionCardRequirement(gameTurn)

                this.server.to(gameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurnWithActionCardRequirements)
                ))
                this.startTurnTimer(gameTurnWithActionCardRequirements)
                break
            }
            case ActionCardType.PAY_PLAYERS: {
                const gameTurnWithActionCardRequirements = await this.gamesMasterService.preparePayPlayersActionCardRequirement(gameTurn)

                this.server.to(gameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurnWithActionCardRequirements)
                ))
                this.startTurnTimer(gameTurnWithActionCardRequirements)
                break
            }
            case ActionCardType.GET_PAYMENT_FROM_PLAYERS: {
                const gameTurnWithActionCardRequirements = await this.gamesMasterService.prepareGetPaymentFromPlayersActionCardRequirement(gameTurn)

                this.server.to(gameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurnWithActionCardRequirements)
                ))
                this.startTurnTimer(gameTurnWithActionCardRequirements)
                break
            }
            case ActionCardType.PROPERTY_REPAIR: {
                const gameTurnWithActionCardRequirements = await this.gamesMasterService.preparePropertyRepairActionCardRequirements(gameTurn)

                this.server.to(gameTurn.gameId).emit('set-game-turn', (
                    await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurnWithActionCardRequirements)
                ))
                this.startTurnTimer(gameTurnWithActionCardRequirements)
                break
            }
            default: {
                throw new Error(`Failed to handle actionCard timeout. Unsupported action card type: ${actionCard.type}.`)
            }
        }
    }

    private async handleThrowOfDiceForGetOutOfJailTimeout(gameTurn: GameTurn): Promise<void> {
        if (!gameTurn.isDouble) {
            const gameTurnPlayer = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)
            if (gameTurnPlayer.attemptsToGetOutOfJailCount < 3) {
                this.startTurnTimer(await this.gamesMasterService.passGameTurnToNextPlayer(gameTurn))
            } else {
                const buyoutFromJailGameTurn = await this.gamesMasterService.prepareBuyoutFromJailRequirement(gameTurn)
                this.startTurnTimer(buyoutFromJailGameTurn)
            }
            return
        }

        const { movingOutOfJailGameTurn, player, fromGameField, toGameField } = await this.gamesMasterService.executeGettingOutOfJailForDiceRoll(gameTurn)

        this.server.to(movingOutOfJailGameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(movingOutOfJailGameTurn)
        ))
        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync([fromGameField, toGameField])
        ))

        this.startTurnTimer(movingOutOfJailGameTurn)
    }

    private async handleMovingOutOfJailTimeout(gameTurn: GameTurn): Promise<void> {
        this.startTurnTimer(
            await this.gamesMasterService.passGameTurnToNextPlayer(gameTurn)
        )
    }

    private async handleGoToJailTimeout(gameTurn: GameTurn): Promise<void> {
        const { movingToJailGameTurn, player, gameFields } = await this.gamesMasterService.executeMovingToJail(gameTurn)

        this.server.to(movingToJailGameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(movingToJailGameTurn)
        ))
        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync(gameFields)
        ))

        this.startTurnTimer(movingToJailGameTurn)
    }

    private async handleMovingToJailTimeout(gameTurn: GameTurn): Promise<void> {
        this.startTurnTimer(
            await this.gamesMasterService.passGameTurnToNextPlayer(gameTurn)
        )
    }

    private async handleThrowOfDiceForMoveTimeout(gameTurn: GameTurn): Promise<void> {
        if (gameTurn.doublesCount >= 3) {
            this.startTurnTimer(
                await this.gamesMasterService.prepareHitOnGoToJailRequirement(gameTurn)
            )
            return
        }

        const { movingGameTurn, player, fromGameField, toGameField } = await this.gamesMasterService.executeMovePlayerForDiceRoll(gameTurn)
        this.server.to(gameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(movingGameTurn)
        ))
        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync([fromGameField, toGameField])
        ))
        this.startTurnTimer(movingGameTurn)
    }

    private async handleMovingTimeout(gameTurn: GameTurn): Promise<void> {
        this.startTurnTimer(
            await this.gamesMasterService.handlePlayerHitGameFieled(gameTurn)
        )
    }

    private async turnTimeout(gameTurn: GameTurn): Promise<void> {
        switch (gameTurn.stage) {
            case GameTurnStage.ROLL_OF_DICE_FOR_MOVE: {
                await this.handleThrowOfDiceForMoveTimeout(gameTurn)
                break
            }
            case GameTurnStage.HIT_ON_GO_TO_JAIL: {
                await this.handleGoToJailTimeout(gameTurn)
                break
            }
            case GameTurnStage.MOVING_TO_JAIL: {
                await this.handleMovingToJailTimeout(gameTurn)
                break
            }
            case GameTurnStage.ROLL_OF_DICE_FOR_GET_OUT_OF_JAIL: {
                await this.handleThrowOfDiceForGetOutOfJailTimeout(gameTurn)
                break
            }
            case GameTurnStage.MOVING: {
                await this.handleMovingTimeout(gameTurn)
                break
            }
            case GameTurnStage.MOVING_OUT_OF_JAIL: {
                await this.handleMovingOutOfJailTimeout(gameTurn)
                break
            }
            case GameTurnStage.ACTION_CARD_SHOWTIME: {
                await this.handleActionCardTimeout(gameTurn)
                break
            }
            default: {
                this.startTurnTimer(await this.gamesMasterService.passGameTurnToNextPlayer(gameTurn))
            }
        }
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

        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to get game state. User not in the game as player.`)
        }

        const game = await this.gamesService.getOneOrThrow(player.gameId)

        socket.emit('game-state',
            await this.gamesFormatterService.formatGameStateAsync(game)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('roll-the-dice-for-move')
    async rollTheDiceForMove(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, thrownDice } = await this.gamesMasterService.rollTheDiceForMove(userId)

        await this.gamesMasterService.removeAllPropertyBuildingPayments(gameTurn)

        this.server.to(gameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurn)
        ))
        this.server.to(gameTurn.gameId).emit('throw-dices', (
            thrownDice
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('roll-dice-to-get-out-of-jail')
    async throwDiceToAttemptGetOutOfJail(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, thrownDice } = await this.gamesMasterService.rollDiceToGetOutOfJail(userId)

        await this.gamesMasterService.removeAllPropertyBuildingPayments(gameTurn)
        this.server.to(gameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurn)
        ))

        this.server.to(gameTurn.gameId).emit('throw-dices', (
            thrownDice
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('buy-game-field')
    async buyGameField(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, player, gameField } = await this.gamesMasterService.buyGameField(userId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync([gameField])
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pay-rent')
    async payRent(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, players } = await this.gamesMasterService.payRent(userId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync(players)
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pay-tax')
    async payTax(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, player } = await this.gamesMasterService.payTax(userId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('buyout-form-jail')
    async buyoutFromJail(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, player } = await this.gamesMasterService.buyoutFromJail(userId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))

        this.startTurnTimer(gameTurn)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pay-the-payment')
    async payThePayment(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: PayThePaymentDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, players } = await this.gamesMasterService.payThePayment(userId, dto.paymentId)

        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync(players)
        ))
        this.server.to(gameTurn.gameId)

        if (gameTurn) {
            this.startTurnTimer(gameTurn)
        }
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('build-on-the-field')
    async buildOnTheGameField(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: BuildOnTheFieldDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const { gameTurn, player, gameField } = await this.gamesMasterService.buildOnTheGameField(userId, dto.fieldId)

        this.server.to(gameTurn.gameId).emit('set-game-turn', (
            await this.gameTurnsFormatterService.formatGameTurnAsync(gameTurn)
        ))
        this.server.to(gameTurn.gameId).emit('update-players', (
            await this.playersFormatterService.formatPlayersAsync([player])
        ))
        this.server.to(gameTurn.gameId).emit('update-game-fields', (
            await this.gameFieldsFormatterService.formatGameFieldsAsync([gameField])
        ))
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
}