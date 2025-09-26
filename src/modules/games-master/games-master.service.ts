import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { GamesService } from '../games/games.service';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { PregameRoomMembersService } from '../pregame-room-members/pregame-room-members.service';
import { PlayersService } from '../players/players.service';
import { GameTurnsService } from '../game-turns/game-turns.service';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { Player, PlayerStatus } from 'src/modules/players/model/player';
import { Game } from 'src/modules/games/model/game';
import { PregameRoom } from 'src/modules/pregame-rooms/model/pregame-room';
import { Message } from 'src/modules/messages/model/message';
import { User } from 'src/modules/users/model/user.model';
import { ActionCardsService } from '../action-cards/action-cards.service';
import { ChatType } from '../chats/model/chat';
import { GameField, GameFieldType } from '../game-fields/model/game-field';
import { GameTurn, GameTurnStage } from '../game-turns/model/game-turn';
import { PregameRoomMember } from '../pregame-room-members/model/pregame-room-member';
import { ActionCard, ActionCardDeckType } from '../action-cards/model/action-card';
import { GamePaymentsService } from '../game-payments/game-payments.service';
import { GamePayment, GamePaymentType } from '../game-payments/model/game-payment';

@Injectable()
export class GamesMasterService {
    constructor(
        private readonly gamesService: GamesService,
        private readonly playersService: PlayersService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly actionCardsService: ActionCardsService,
        private readonly gamePaymentsService: GamePaymentsService,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly chatsService: ChatsService,
        private readonly messagesService: MessagesService
    ) { }

    async defineNextGameTurn(gameTurn: GameTurn): Promise<{ gameTurn: GameTurn, player: Player }> {
        const gamePlayers = await this.playersService.findAllByGameId(gameTurn.gameId)
        const sortedPlayers = gamePlayers.sort((a, b) => a.turnNumber - b.turnNumber)

        const currentPlayerIndex = sortedPlayers.findIndex((player: Player) =>
            player.id === gameTurn.playerId
        )
        const nextPlayerIndex = (currentPlayerIndex + 1) % sortedPlayers.length
        const nextPlayer = sortedPlayers[nextPlayerIndex]

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { playerId: nextPlayer.id, stage: GameTurnStage.MOVE })
        if (!updatedGameTurn) {
            throw new Error(`Failed to define next game turn. Game turn was not updated.`)
        }

        return {
            gameTurn: updatedGameTurn,
            player: nextPlayer
        }
    }

    async movePlayer(playerId: string, position: number): Promise<{ player: Player, newGameField: GameField, leftGameField: GameField }> {
        const player = await this.playersService.findOne(playerId)
        if (!player) {
            throw new InternalServerErrorException(`Failed to move player. Player not found`)
        }

        const startingGameField = await this.gameFieldsService.getOneOrThrow(player.gameFieldId)

        const gameField = await this.gameFieldsService.findOneByGameIdAndPosition(player.gameId, position)
        if (!gameField) {
            throw new InternalServerErrorException(`Failed to move. New game field not found`)
        }

        const updatedPlayer = await this.playersService.updateOne(player.id, { gameFieldId: gameField.id })
        if (!updatedPlayer) {
            throw new Error(`Failed to move player. Player was not updated.`)
        }

        return {
            player: updatedPlayer,
            newGameField: gameField,
            leftGameField: startingGameField,
        }
    }

    async initGame(userId: string): Promise<{ game: Game, gameFields: GameField[], players: Player[], gameTurn: GameTurn, pregameRoom: PregameRoom }> {
        const userAsPregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!userAsPregameRoomMember) {
            throw new BadRequestException(`Failed to start game. User not in the pregame room to start game.`)
        }
        if (!userAsPregameRoomMember.isOwner) {
            throw new BadRequestException(`Failed to start game. User is not pregame room owner.`)
        }

        const [pregameRoom, pregameRoomMembers] = await Promise.all([
            this.pregamesRoomsService.getOneOrThrow(userAsPregameRoomMember.pregameRoomId),
            this.pregameRoomMembersService.findAllByPregameRoomId(userAsPregameRoomMember.pregameRoomId),
        ])
        if (pregameRoomMembers.length < 2) {
            throw new BadRequestException(`Failed to start game. Incorrect members count to start game.`)
        }

        const pregameRoomChat = await this.chatsService.findOne(pregameRoom.chatId)
        if (!pregameRoomChat) {
            throw new InternalServerErrorException(`Failed to start game. Pregame room chat not found.`)
        }

        const [game] = await Promise.all([
            this.gamesService.create(pregameRoomChat.id),
            this.chatsService.updateType(pregameRoomChat.id, ChatType.GAME)
        ])

        const gameFields = await this.gameFieldsService.createGameFields(game.id)
        const goField = gameFields.find((field: GameField) => field.type === GameFieldType.GO)
        if (!goField) {
            throw new InternalServerErrorException('Failed to start game. Go field not found.')
        }

        const [players] = await Promise.all([
            await Promise.all(pregameRoomMembers.map(async (member: PregameRoomMember, index) =>
                await this.playersService.create(game.id, member.userId, goField.id, member.playerChip, PlayerStatus.COMMON, index + 1)
            )),
            this.actionCardsService.createGameChanceItems(game.id)
        ])
        if (players.length === 0) {
            throw new InternalServerErrorException(`Failed to start game. Players not defined.`)
        }

        let turnOwnerPlayer = players.find((player: Player) => player.turnNumber === 1)
        if (!turnOwnerPlayer) {
            turnOwnerPlayer = players[0]
        }

        const gameTurn = await this.gameTurnsService.create(game.id, turnOwnerPlayer.id, 30)

        await this.pregamesRoomsService.destroy(userAsPregameRoomMember.pregameRoomId)

        return {
            game,
            gameFields,
            players,
            gameTurn,
            pregameRoom
        }
    }

    async getGameState(userId: string): Promise<{ game: Game, gameFields: GameField[], players: Player[], gameTurn: GameTurn, actionCard: ActionCard | null }> {
        const currentPlayer = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!currentPlayer) {
            throw new BadRequestException(`Failed to get game state. User is not player of the game.`)
        }

        const [game, gameFields, players, gameTurn] = await Promise.all([
            this.gamesService.getOneOrThrow(currentPlayer.gameId),
            this.gameFieldsService.findAllByGameId(currentPlayer.gameId),
            this.playersService.findAllByGameId(currentPlayer.gameId),
            this.gameTurnsService.getOneByGameIdOrThrow(currentPlayer.gameId),
        ])

        return {
            game,
            gameFields,
            players,
            gameTurn,
            actionCard: gameTurn.actionCardId ? await this.actionCardsService.findOne(gameTurn.actionCardId) : null
        }
    }

    private throwDices(): { dices: number[], summ: number, isDouble: boolean } {
        const DICES_COUNT = 2
        const DICE_SIDES = 6

        let dices: number[] = []
        let summ: number = 0

        while (dices.length < DICES_COUNT) {
            const throwDiceResult = Math.floor(Math.random() * DICE_SIDES) + 1
            dices.push(throwDiceResult)
            summ += throwDiceResult
        }

        return {
            dices,
            summ,
            isDouble: dices[0] === dices[1] ? true : false
        }
    }

    async makeMove(userId: string): Promise<{
        game: Game, player: Player, newGameField: GameField, leftGameField: GameField, gameTurn: GameTurn,
        thrownDices: {
            dices: number[],
            summ: number,
            isDouble: boolean
        }
    }> {
        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to move. User not in the game.`)
        }

        const [gameTurn, currentGameField, game] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId),
            this.gamesService.getOneOrThrow(player.gameId)
        ])

        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to move. Player. Player has no right to move`)
        }
        if (gameTurn.stage !== GameTurnStage.MOVE) {
            throw new BadRequestException(`Failed to move. Player. Not move stage`)
        }

        const thrownDices = this.throwDices()
        const newPosition = ((currentGameField.position + thrownDices.summ - 1) % 40) + 1

        if (currentGameField.position + thrownDices.summ > 40) {
            await Promise.all([
                this.playersService.updateOne(player.id, { balance: player.balance + 200, paymentForCircle: true }),
                this.gameTurnsService.updateOne(gameTurn.id, { stepsCount: thrownDices.summ })
            ])
        }

        const [movePlayer, updatedGameTurn] = await Promise.all([
            this.movePlayer(player.id, newPosition),
            this.gameTurnsService.getOneOrThrow(gameTurn.id)
        ])

        return {
            game,
            player: movePlayer.player,
            newGameField: movePlayer.newGameField,
            leftGameField: movePlayer.leftGameField,
            gameTurn: updatedGameTurn,
            thrownDices: thrownDices
        }
    }

    async getGameChatMessagesPage(userId: string, pageNumber: number, pageSize: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const currentPlayer = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!currentPlayer) {
            throw new NotFoundException(`Failed to send game chat message. User not in the game.`)
        }

        const game = await this.gamesService.getOneOrThrow(currentPlayer.gameId)

        const gameChat = await this.chatsService.findOne(game.chatId)
        if (!gameChat) {
            throw new InternalServerErrorException('Failed to get pregame room messages page. Game chat not found.')
        }

        return await this.messagesService.getMessagesPage(gameChat.id, pageNumber, pageSize)
    }

    async sendGameChatMessage(userId: string, messageText: string): Promise<{ message: Message, user: User, player: Player, gameId: string }> {
        const [user, currentPlayer] = await Promise.all([
            this.usersService.getOneOrThrow(userId),
            this.playersService.findCurrentPlayerByUserId(userId),
        ])

        if (!currentPlayer) {
            throw new NotFoundException(`Failed to send game chat message. User not in the game.`)
        }
        if (messageText.length === 0) {
            throw new BadRequestException(`Failed to send game chat message. Message text must not be empty.`)
        }

        const game = await this.gamesService.getOneOrThrow(currentPlayer.gameId)

        const gameChat = await this.chatsService.findOne(game.chatId)
        if (!gameChat) {
            throw new InternalServerErrorException(`Failed to send game chat message. Game chat not found.`)
        }

        const newMessage = await this.messagesService.create(user.id, gameChat.id, messageText)

        return {
            message: newMessage,
            user,
            player: currentPlayer,
            gameId: currentPlayer.gameId
        }
    }

    async processPayPropertyRent(gameField: GameField, gameTurn: GameTurn): Promise<{ gamePayment: GamePayment, gameTurn: GameTurn }> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay property rent. No need to pay rent.`)
        }

        const newGamePayment = await this.gamePaymentsService.create(
            GamePaymentType.PAY_RENT,
            gameField.rent[gameField.buildsCount || 0],
            gameTurn.gameId
        )
        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, gamePaymentId: newGamePayment.id })
        if (!updatedGameTurn) {
            throw new Error(`Failed process pay property rent. Game turn was not updated`)
        }

        return {
            gamePayment: newGamePayment,
            gameTurn: updatedGameTurn
        }
    }

    async processPayRailoadRent(gameField: GameField, gameTurn: GameTurn): Promise<{ gamePayment: GamePayment, gameTurn: GameTurn }> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay railroad rent. No need to pay rent.`)
        }

        const railroadsOwner = await this.gameFieldsService.findAllByOwnerPlayerIdAndType(gameField.ownerPlayerId, GameFieldType.RAILROAD)

        const newGamePayment = await this.gamePaymentsService.create(
            GamePaymentType.PAY_RENT,
            gameField.rent[railroadsOwner.length - 1],
            gameTurn.gameId
        )

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, gamePaymentId: newGamePayment.id })
        if (!updatedGameTurn) {
            throw new Error(`Failed process pay railroad rent. Game turn was not updated`)
        }

        return {
            gamePayment: newGamePayment,
            gameTurn: updatedGameTurn
        }
    }

    async processPayUtilityRent(gameField: GameField, gameTurn: GameTurn): Promise<{ gamePayment: GamePayment, gameTurn: GameTurn }> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay utility rent. No need to pay rent.`)
        }

        const utilitesOwner = await this.gameFieldsService.findAllByOwnerPlayerIdAndType(gameField.ownerPlayerId, GameFieldType.UTILITY)

        const newGamePayment = await this.gamePaymentsService.create(
            GamePaymentType.PAY_RENT,
            gameField.rent[utilitesOwner.length - 1] * gameTurn.stepsCount,
            gameTurn.gameId
        )

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, gamePaymentId: newGamePayment.id })
        if (!updatedGameTurn) {
            throw new Error(`Failed process pay utility rent. Game turn was not updated`)
        }

        return {
            gamePayment: newGamePayment,
            gameTurn: updatedGameTurn
        }
    }

    async processBuyGameField(gameField: GameField, gameTurn: GameTurn): Promise<{ gamePayment: GamePayment, gameTurn: GameTurn }> {
        if (!gameField.basePrice) {
            throw new InternalServerErrorException(`Failed to process buy game field. Game field base price not found.`)
        }

        const newGamePayment = await this.gamePaymentsService.create(
            GamePaymentType.BUY_GAME_FIELD,
            gameField.basePrice,
            gameTurn.gameId
        )

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.BUY_GAME_FIELD, gamePaymentId: newGamePayment.id })
        if (!updatedGameTurn) {
            throw new Error(`Failed to process buy game field. Game turn was not updated.`)
        }

        return {
            gamePayment: newGamePayment,
            gameTurn: updatedGameTurn
        }
    }

    async processPayTax(gameField: GameField, gameTurn: GameTurn): Promise<{ gamePayment: GamePayment, gameTurn: GameTurn }> {
        if (!gameField.rent) {
            throw new InternalServerErrorException(`Failed to process pay tax. Game field rent not found.`)
        }

        const newGamePayment = await this.gamePaymentsService.create(
            GamePaymentType.PAY_TAX,
            gameField.rent[0],
            gameTurn.gameId
        )

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_TAX, gamePaymentId: newGamePayment.id })
        if (!updatedGameTurn) {
            throw new Error(`Failed to process pay tax. Game turn was not updated.`)
        }

        return {
            gamePayment: newGamePayment,
            gameTurn: updatedGameTurn
        }
    }

    async processHitGameFiled(player: Player, gameField: GameField, gameTurn: GameTurn)
        : Promise<{ gameTurn: GameTurn, gamePayment: GamePayment | null, actionCard: ActionCard | null }> {
        switch (gameField.type) {
            case GameFieldType.PROPERTY: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    const processedPayPropertyRent = await this.processPayPropertyRent(gameField, gameTurn)
                    return {
                        gameTurn: processedPayPropertyRent.gameTurn,
                        gamePayment: processedPayPropertyRent.gamePayment,
                        actionCard: null
                    }
                }

                if (!gameField.ownerPlayerId) {
                    const processedBuyGameField = await this.processBuyGameField(gameField, gameTurn)
                    return {
                        gameTurn: processedBuyGameField.gameTurn,
                        gamePayment: processedBuyGameField.gamePayment,
                        actionCard: null
                    }
                }

                return {
                    gameTurn: (await this.defineNextGameTurn(gameTurn)).gameTurn,
                    gamePayment: null,
                    actionCard: null
                }
            }
            case GameFieldType.RAILROAD: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    const processedPayRailroadRent = await this.processPayRailoadRent(gameField, gameTurn)
                    return {
                        gameTurn: processedPayRailroadRent.gameTurn,
                        gamePayment: processedPayRailroadRent.gamePayment,
                        actionCard: null
                    }
                }

                if (!gameField.ownerPlayerId) {
                    const processedBuyGameField = await this.processBuyGameField(gameField, gameTurn)
                    return {
                        gameTurn: processedBuyGameField.gameTurn,
                        gamePayment: processedBuyGameField.gamePayment,
                        actionCard: null
                    }
                }

                return {
                    gameTurn: (await this.defineNextGameTurn(gameTurn)).gameTurn,
                    gamePayment: null,
                    actionCard: null
                }
            }
            case GameFieldType.UTILITY: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    const processedPayRailroadRent = await this.processPayUtilityRent(gameField, gameTurn)
                    return {
                        gameTurn: processedPayRailroadRent.gameTurn,
                        gamePayment: processedPayRailroadRent.gamePayment,
                        actionCard: null
                    }
                }

                if (!gameField.ownerPlayerId) {
                    const processedBuyGameField = await this.processBuyGameField(gameField, gameTurn)
                    return {
                        gameTurn: processedBuyGameField.gameTurn,
                        gamePayment: processedBuyGameField.gamePayment,
                        actionCard: null
                    }
                }

                return {
                    gameTurn: (await this.defineNextGameTurn(gameTurn)).gameTurn,
                    gamePayment: null,
                    actionCard: null
                }
            }
            case GameFieldType.TAX: {
                const processedPayTax = await this.processPayTax(gameField, gameTurn)
                return {
                    gameTurn: processedPayTax.gameTurn,
                    gamePayment: processedPayTax.gamePayment,
                    actionCard: null
                }
            }
            default: return {
                gameTurn: (await this.defineNextGameTurn(gameTurn)).gameTurn,
                gamePayment: null,
                actionCard: null
            }
        }
    }

    async buyGameField(userId: string): Promise<{ player: Player, gameField: GameField, gameTurn: GameTurn }> {
        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to buy game field. User not in the game.`)
        }

        const [gameTurn, gameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId)
        ])
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to buy game field. Player has no turn rights.`)
        }
        if (!gameTurn.gamePaymentId) {
            throw new InternalServerErrorException(`Failed to buy game field. Game payment not found.`)
        }

        const gamePayment = await this.gamePaymentsService.getOneOrThrow(gameTurn.gamePaymentId)
        if (gamePayment.type !== GamePaymentType.BUY_GAME_FIELD) {
            throw new BadRequestException(`Failed to buy game field. Payment not for buy game field.`)
        }
        if (player.balance < gamePayment.amount) {
            throw new BadRequestException(`Failed to buy game field. Not enough balance to buy game field.`)
        }

        const [updatedPlayer, updatedGameField] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount }),
            this.gameFieldsService.updateOne(gameField.id, { ownerPlayerId: player.id }),
            this.gamePaymentsService.destroy(gamePayment.id)
        ])
        if (!updatedPlayer) {
            throw new Error(`Failed to buy game filed. Player was not updated.`)
        }
        if (!updatedGameField) {
            throw new Error(`Failed to buy game filed. Game field was not updated.`)
        }

        return {
            player: updatedPlayer,
            gameField: updatedGameField,
            gameTurn: gameTurn
        }
    }

    async payRent(userId: string): Promise<{ payingPlayer: Player, getPaymentPlayer: Player, gameTurn: GameTurn }> {
        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to pay rent. User not in the game.`)
        }

        const [gameTurn, gameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId)
        ])
        if (gameTurn.stage !== GameTurnStage.PAY_RENT) {
            throw new BadRequestException(`Failed to pay tax. Not pay tax game turn stage.`)
        }
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to pay rent. Player has no turn rights.`)
        }
        if (!gameTurn.gamePaymentId) {
            throw new InternalServerErrorException(`Failed to pay rent. Game payment not found.`)
        }
        if (!gameField.ownerPlayerId) {
            throw new InternalServerErrorException(`Failed to pay rent. Game field has no owner player.`)
        }

        const [gamePayment, gameFieldOwnerPlayer] = await Promise.all([
            this.gamePaymentsService.getOneOrThrow(gameTurn.gamePaymentId),
            this.playersService.getOneOrThrow(gameField.ownerPlayerId)
        ])
        if (player.balance < gamePayment.amount) {
            throw new BadRequestException(`Failed to pay rent. Not enough balance to pay payment.`)
        }

        const [payingPlayer, getPaymentPlayer] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount }),
            this.playersService.updateOne(gameFieldOwnerPlayer.id, { balance: gameFieldOwnerPlayer.balance + gamePayment.amount }),
            this.gamePaymentsService.destroy(gamePayment.id)
        ])
        if (!payingPlayer || !getPaymentPlayer) {
            throw new Error(`Failed to pay rent. Anyone player was not updated.`)
        }

        return {
            payingPlayer,
            getPaymentPlayer,
            gameTurn
        }
    }

    async payTax(userId: string): Promise<{ player: Player, gameTurn: GameTurn }> {
        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to pay tax. User not in the game.`)
        }

        const [gameTurn, gameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId)
        ])
        if (gameTurn.stage !== GameTurnStage.PAY_TAX) {
            throw new BadRequestException(`Failed to pay tax. Not pay tax game turn stage.`)
        }
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to pay tax. Player has no turn rights.`)
        }
        if (!gameTurn.gamePaymentId) {
            throw new InternalServerErrorException(`Failed to pay tax. Game payment not found.`)
        }

        const gamePayment = await this.gamePaymentsService.getOneOrThrow(gameTurn.gamePaymentId)
        if (player.balance < gamePayment.amount) {
            throw new BadRequestException(`Failed to pay tax. Not enough balance to pay tax.`)
        }

        const [upatedPlayer] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount }),
            this.gamePaymentsService.destroy(gamePayment.id)
        ])
        if (!upatedPlayer) {
            throw new Error(`Failed to pay rent. Anyone player was not updated.`)
        }

        return {
            player: upatedPlayer,
            gameTurn
        }
    }
}