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
import { ActionCard, ActionCardDeckType, ActionCardMoveDirection, ActionCardPropertyType } from '../action-cards/model/action-card';
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

    private readonly BOARD_SIZE = 40
    private readonly GAME_TURN_EXPIRES = 30
    private readonly ACTION_CARD_DURATION = 7

    private transformPropertyTypeToGameFieldTypeOrThrow(propertyType: ActionCardPropertyType): GameFieldType {
        switch (propertyType) {
            case ActionCardPropertyType.UTILITY: return GameFieldType.UTILITY
            case ActionCardPropertyType.RAILROAD: return GameFieldType.RAILROAD
            default: throw new Error(`Failed to transform ActionCardPropertyType to GameFieldType.`)
        }
    }

    private async findNearestGameFieldByPropertyType(gameId: string, currentGameFieldPosition: number, propertyType: ActionCardPropertyType): Promise<GameField> {
        const transformedPropertyTypeToGameFieldType = this.transformPropertyTypeToGameFieldTypeOrThrow(propertyType)
        const gameFieldsWithNecessaryType = await this.gameFieldsService.findAllByGameIdAndType(
            gameId,
            transformedPropertyTypeToGameFieldType
        )
        if (!gameFieldsWithNecessaryType.length) {
            throw new Error(`Failed to find all GameFields by gameId: ${gameId} and type: ${transformedPropertyTypeToGameFieldType}`)
        }

        let nearestGameField: GameField = gameFieldsWithNecessaryType[0]
        let minPathLength = Infinity

        for (let i = 0; i < gameFieldsWithNecessaryType.length; i++) {
            let pathLength: number = 0

            if (currentGameFieldPosition > gameFieldsWithNecessaryType[i].position) {
                pathLength = (40 - currentGameFieldPosition) + gameFieldsWithNecessaryType[i].position
            } else {
                pathLength = gameFieldsWithNecessaryType[i].position - currentGameFieldPosition
            }

            if (pathLength < minPathLength) {
                nearestGameField = gameFieldsWithNecessaryType[i]
                minPathLength = pathLength
            }
        }

        return nearestGameField
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
                await this.playersService.create({
                    gameId: game.id,
                    userId: member.userId,
                    gameFieldId: goField.id,
                    chip: member.playerChip,
                    status: PlayerStatus.COMMON,
                    turnNumber: index + 1,
                    balance: 1500,
                })
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

        const gameTurn = await this.gameTurnsService.create({
            gameId: game.id,
            stage: GameTurnStage.MOVE,
            playerId: turnOwnerPlayer.id,
            expires: 30
        })

        await this.pregamesRoomsService.destroy(userAsPregameRoomMember.pregameRoomId)

        return {
            game,
            gameFields,
            players,
            gameTurn,
            pregameRoom
        }
    }

    async passGameTurnToNextPlayer(gameTurn: GameTurn): Promise<GameTurn> {
        const gamePlayers = await this.playersService.findAllByGameId(gameTurn.gameId)
        const sortedPlayers = gamePlayers.sort((a, b) => a.turnNumber - b.turnNumber)

        const currentPlayerIndex = sortedPlayers.findIndex((player: Player) =>
            player.id === gameTurn.playerId
        )
        const nextPlayerIndex = (currentPlayerIndex + 1) % sortedPlayers.length
        const nextPlayer = sortedPlayers[nextPlayerIndex]

        const [nextGameTurn] = await Promise.all([
            this.gameTurnsService.create({
                gameId: gameTurn.gameId,
                playerId: nextPlayer.id,
                stage: GameTurnStage.MOVE,
                expires: this.GAME_TURN_EXPIRES
            }),
            this.gameTurnsService.destroy(gameTurn.id)
        ])

        return nextGameTurn
    }

    async grantExtraTurn(gameTurn: GameTurn): Promise<GameTurn> {
        const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

        const [newGameTurn] = await Promise.all([
            this.gameTurnsService.create({
                gameId: gameTurn.gameId,
                playerId: player.id,
                stage: GameTurnStage.MOVE,
                expires: this.GAME_TURN_EXPIRES
            }),
            this.gameTurnsService.destroy(gameTurn.id)
        ])

        return newGameTurn
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

    async movePlayer(playerId: string, position: number): Promise<{ player: Player, newGameField: GameField, leftGameField: GameField }> {
        const player = await this.playersService.findOneById(playerId)
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

    private async handleCircleCompletion(player: Player, gameTurn: GameTurn, previousGameField: GameField): Promise<Player> {
        if (previousGameField.position + gameTurn.stepsCount <= this.BOARD_SIZE) {
            return player
        }

        if (player.paymentForCircle) {
            return await this.playersService.updateOne(player.id, { balance: player.balance + 200 })
        } else {
            return await this.playersService.updateOne(player.id, { paymentForCircle: true })
        }
    }

    async makeMove(userId: string): Promise<{
        gameId: string, player: Player, newGameField: GameField, leftGameField: GameField, gameTurn: GameTurn
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

        const [gameTurn, fromGameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId),
        ])

        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to move. Player has no right to move`)
        }
        if (gameTurn.stage !== GameTurnStage.MOVE) {
            throw new BadRequestException(`Failed to move. Player. Not move stage`)
        }

        const thrownDices = this.throwDices()
        const newPosition = (fromGameField.position + thrownDices.summ - 1) % this.BOARD_SIZE + 1

        
        const [moveResult, updatedGameTurn] = await Promise.all([
            this.movePlayer(player.id, newPosition),
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.THROWING_DICES, expires: 1, stepsCount: thrownDices.summ, isDouble: thrownDices.isDouble, doublesCount: gameTurn.doublesCount + 1 })
        ])

        const updatedPlayer = await this.handleCircleCompletion(moveResult.player, updatedGameTurn, fromGameField)

        return {
            gameId: updatedGameTurn.gameId,
            player: updatedPlayer,
            newGameField: moveResult.newGameField,
            leftGameField: moveResult.leftGameField,
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

    private async preparePropertyRentRequirement(gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay property rent. No need to pay rent.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.PAY_RENT,
                payerPlayerId: gameTurn.playerId,
                receiverPlayerId: gameField.ownerPlayerId,
                amount: gameField.rent[gameField.buildsCount || 0],
                gameTurnId: gameTurn.id,
                isOptional: false
            })
        ])

        return updatedGameTurn
    }

    private async prepareRailroadRentRequirement(gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay railroad rent. No need to pay rent.`)
        }

        const railroadOwner = await this.gameFieldsService.findAllByOwnerPlayerIdAndType(gameField.ownerPlayerId, GameFieldType.RAILROAD)

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.PAY_RENT,
                payerPlayerId: gameTurn.playerId,
                receiverPlayerId: gameField.ownerPlayerId,
                amount: gameField.rent[railroadOwner.length - 1],
                gameTurnId: gameTurn.id,
                isOptional: false
            })
        ])

        return updatedGameTurn
    }

    private async prepareUtilityRentRequirement(gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameField.ownerPlayerId || !gameField.rent) {
            throw new Error(`Failed to process pay utility rent. No need to pay rent.`)
        }

        const utilitesOwner = await this.gameFieldsService.findAllByOwnerPlayerIdAndType(gameField.ownerPlayerId, GameFieldType.UTILITY)

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_RENT, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.PAY_RENT,
                payerPlayerId: gameTurn.playerId,
                receiverPlayerId: gameField.ownerPlayerId,
                amount: gameField.rent[utilitesOwner.length - 1] * gameTurn.stepsCount,
                gameTurnId: gameTurn.id,
                isOptional: false
            })
        ])

        return updatedGameTurn
    }

    private async prepareTaxRequirement(gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameField.rent) {
            throw new InternalServerErrorException(`Failed to process pay tax. Game field rent not found.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_TAX, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.PAY_TAX,
                payerPlayerId: gameTurn.playerId,
                amount: gameField.rent[0],
                gameTurnId: gameTurn.id,
                isOptional: false
            })
        ])

        return updatedGameTurn
    }

    private async prepareBuyGameFieldRequirement(gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameField.basePrice) {
            throw new InternalServerErrorException(`Failed to process buy game field. Game field base price not found.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.BUY_GAME_FIELD, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.BUY_GAME_FIELD,
                payerPlayerId: gameTurn.playerId,
                amount: gameField.basePrice,
                gameTurnId: gameTurn.id,
                isOptional: true
            })
        ])

        return updatedGameTurn
    }

    async executeMoveActionCardRequirement(gameTurn: GameTurn)
        : Promise<{ gameTurn: GameTurn, player: Player, fromGameField: GameField, toGameField: GameField }> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to execute MOVE actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }

        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)

        switch (actionCard.moveDirection) {
            case ActionCardMoveDirection.TARGET: {
                if (!actionCard.targetPosition) {
                    throw new Error(`Failed to execute requirement of actionCard with id: ${actionCard.id}; direction: ${actionCard.moveDirection}. targetPosition not defined.`)
                }

                const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

                const [fromGameField, toGameField] = await Promise.all([
                    this.gameFieldsService.getOneOrThrow(player.gameFieldId),
                    this.gameFieldsService.getOneByGameIdAndPosition(gameTurn.gameId, actionCard.targetPosition)
                ])

                await this.playersService.updateOne(player.id, { paymentForCircle: actionCard.paymentForCircle })

                const stepsCount = (toGameField.position - fromGameField.position + this.BOARD_SIZE) % this.BOARD_SIZE
                const [movePlayerResult, updatedGameTurn] = await Promise.all([
                    this.movePlayer(player.id, toGameField.position),
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null })
                ])

                const updatedPlayer = await this.handleCircleCompletion(movePlayerResult.player, updatedGameTurn, fromGameField)

                await this.actionCardsService.updateOneById(actionCard.id, { isActive: false })

                return {
                    gameTurn: updatedGameTurn,
                    player: updatedPlayer,
                    fromGameField,
                    toGameField
                }
            }
            case ActionCardMoveDirection.NEAREST: {
                if (!actionCard.propertyType) {
                    throw new Error(`Failed to execute requirement of actionCard with id: ${actionCard.id}; direction: ${actionCard.moveDirection}. propertyType not defined.`)
                }

                const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

                const fromGameField = await this.gameFieldsService.getOneOrThrow(player.gameFieldId)
                const toGameField = await this.findNearestGameFieldByPropertyType(gameTurn.gameId, fromGameField.position, actionCard.propertyType)

                await this.playersService.updateOne(player.id, { paymentForCircle: actionCard.paymentForCircle })

                const stepsCount = (toGameField.position - fromGameField.position + this.BOARD_SIZE) % this.BOARD_SIZE
                const [movePlayerResult, updatedGameTurn] = await Promise.all([
                    this.movePlayer(player.id, toGameField.position),
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null })
                ])

                const updatedPlayer = await this.handleCircleCompletion(movePlayerResult.player, updatedGameTurn, fromGameField)

                await this.actionCardsService.updateOneById(actionCard.id, { isActive: false })

                return {
                    gameTurn: updatedGameTurn,
                    player: updatedPlayer,
                    fromGameField,
                    toGameField
                }
            }
            case ActionCardMoveDirection.GET_BACK: {
                if (!actionCard.moveSteps) {
                    throw new Error(`Failed to execute requirement of actionCard with id: ${actionCard.id}; direction: ${actionCard.moveDirection}. moveSteps not defined.`)
                }

                const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

                const fromGameField = await this.gameFieldsService.getOneOrThrow(player.gameFieldId)

                const targetPosition = fromGameField.position < actionCard.moveSteps
                    ? 1
                    : fromGameField.position - actionCard.moveSteps
                const toGameField = await this.gameFieldsService.getOneByGameIdAndPosition(gameTurn.gameId, targetPosition)

                const stepsCount = (toGameField.position - fromGameField.position + this.BOARD_SIZE) % this.BOARD_SIZE
                const [movePlayerResult, updatedGameTurn] = await Promise.all([
                    this.movePlayer(player.id, toGameField.position),
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null })
                ])

                await this.actionCardsService.updateOneById(actionCard.id, { isActive: false })

                return {
                    gameTurn: updatedGameTurn,
                    player: movePlayerResult.player,
                    fromGameField,
                    toGameField
                }
            }
            default: {
                throw new Error(`Failed to execute move actionCard requirement. Failed to process actionCard's moveDirection.`)
            }
        }
    }

    async executeGetMoneyActionCardRequirement(gameTurn: GameTurn): Promise<{ gameTurn: GameTurn, player: Player }> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to execute GET_MONEY actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const [actionCard, player] = await Promise.all([
            this.actionCardsService.getOneOrThrow(gameTurn.actionCardId),
            this.playersService.getOneByIdOrThrow(gameTurn.playerId)
        ])

        if (!actionCard.amount) {
            throw new Error(`Failed to execute GET_MONEY actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        const [updatedGameTurn, updatedPlayer] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { actionCardId: null }),
            this.playersService.updateOne(gameTurn.playerId, { balance: player.balance + actionCard.amount })
        ])

        return {
            gameTurn: updatedGameTurn,
            player: updatedPlayer 
        }
    }

    async preparePayMoneyActionCardRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to prepare PAY_MONEY actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)

        if (!actionCard.amount) {
            throw new Error(`Failed to prepare PAY_MONEY actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        await Promise.all([
            this.gamePaymentsService.create({
                type: GamePaymentType.TO_BANK,
                payerPlayerId: gameTurn.playerId,
                amount: actionCard.amount,
                gameTurnId: gameTurn.id,
                isOptional: false
            }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return await this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.ACTION_CARD_REQUIREMENTS, actionCardId: null, expires: this.GAME_TURN_EXPIRES })
    }

    private async executeActionCardShowtime(gameTurn: GameTurn, actionCard: ActionCard): Promise<GameTurn> {
        return await this.gameTurnsService.updateOne(gameTurn.id, {
            stage: GameTurnStage.ACTION_CARD_SHOWTIME,
            actionCardId: actionCard.id,
            expires: this.ACTION_CARD_DURATION
        })
    }

    async handlePlayerHitGameFieled(player: Player, gameField: GameField, gameTurn: GameTurn): Promise<GameTurn> {
        switch (gameField.type) {
            case GameFieldType.PROPERTY: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    return await this.preparePropertyRentRequirement(gameField, gameTurn)
                }
                if (!gameField.ownerPlayerId) {
                    return this.prepareBuyGameFieldRequirement(gameField, gameTurn)
                }
                return gameTurn.isDouble ? await this.grantExtraTurn(gameTurn) : await this.passGameTurnToNextPlayer(gameTurn)
            }
            case GameFieldType.RAILROAD: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    return await this.prepareRailroadRentRequirement(gameField, gameTurn)
                }
                if (!gameField.ownerPlayerId) {
                    return await this.prepareBuyGameFieldRequirement(gameField, gameTurn)
                }
                return gameTurn.isDouble ? await this.grantExtraTurn(gameTurn) : await this.passGameTurnToNextPlayer(gameTurn)
            }
            case GameFieldType.UTILITY: {
                if (gameField.ownerPlayerId && gameField.ownerPlayerId !== player.id) {
                    return await this.prepareUtilityRentRequirement(gameField, gameTurn)
                }
                if (!gameField.ownerPlayerId) {
                    return await this.prepareBuyGameFieldRequirement(gameField, gameTurn)
                }
                return gameTurn.isDouble ? await this.grantExtraTurn(gameTurn) : await this.passGameTurnToNextPlayer(gameTurn)
            }
            case GameFieldType.TAX: {
                return await this.prepareTaxRequirement(gameField, gameTurn)
            }
            case GameFieldType.CHANCE: {
                return await this.executeActionCardShowtime(
                    gameTurn,
                    await this.actionCardsService.getRandomActiveActionCard(gameTurn.gameId, ActionCardDeckType.CHANCE)
                )
            }
            case GameFieldType.COMMUNITY_CHEST: {
                return await this.executeActionCardShowtime(
                    gameTurn,
                    await this.actionCardsService.getRandomActiveActionCard(gameTurn.gameId, ActionCardDeckType.COMMUNITY_CHEST)
                )
            }
            default: return gameTurn.isDouble ? await this.grantExtraTurn(gameTurn) : await this.passGameTurnToNextPlayer(gameTurn)
        }
    }

    private async executeGameFieldPurchase(player: Player, payment: GamePayment): Promise<{ player: Player, gameField: GameField }> {
        const gameField = await this.gameFieldsService.findOne(player.gameFieldId)
        if (!gameField) {
            throw new Error(`Failed to execute gameField purchase. gameField not found. Player id: ${player.id}; gameField id: ${player.gameFieldId}`)
        }
        if (!gameField.basePrice) {
            throw new Error(`Failed to buy game field. Game field isn't for purchcase.`)
        }
        if (gameField.ownerPlayerId) {
            throw new Error(`Failed to buy game field. Game field already has owner. Player id: ${player.id}; gameField id: ${player.gameFieldId}`)
        }

        const [updatedPlayer, updatedGameField] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - payment.amount }),
            this.gameFieldsService.updateOne(gameField.id, { ownerPlayerId: player.id })
        ])

        return {
            player: updatedPlayer,
            gameField: updatedGameField
        }
    }

    private async executeToBankPayment(player: Player, payment: GamePayment): Promise<Player> {
        return await this.playersService.updateOne(player.id, { balance: player.balance - payment.amount })
    }

    private async executeToPlayerPayment(payment: GamePayment): Promise<Player[]> {
        const [payerPlayer, receiverPaymentPlayer] = await Promise.all([
            this.playersService.findOneById(payment.payerPlayerId),
            this.playersService.findOneById(payment.receiverPlayerId)
        ])
        if (!payerPlayer || payerPlayer.status != PlayerStatus.COMMON || !receiverPaymentPlayer || receiverPaymentPlayer.status !== PlayerStatus.COMMON) {
            throw new Error(`Cannot process rent payment: one or both players are not active in the game. Payer player id: ${payment.payerPlayerId}; recipient player id: ${payment.receiverPlayerId}.`)
        }

        return [
            await this.playersService.updateOne(payerPlayer.id, {
                balance: payerPlayer.balance - payment.amount
            }),
            await this.playersService.updateOne(receiverPaymentPlayer.id, {
                balance: receiverPaymentPlayer.balance + payment.amount
            })
        ]
    }

    private async executeToPlayersPayment(payment: GamePayment): Promise<Player[]> {
        const payerPlayer = await this.playersService.getOneByIdOrThrow(payment.payerPlayerId)

        const players = await this.playersService.findAllByGameId(payerPlayer.gameId)
        const receiverPlayers = players.filter(p => p.id !== payerPlayer.id && p.status !== PlayerStatus.IS_LEFT)

        const [updatedPayerPlayer, updatedReceiverPlayers] = await Promise.all([
            this.playersService.updateOne(payerPlayer.id, { balance: payerPlayer.balance - payment.amount }),
            Promise.all(
                receiverPlayers.map(p => (
                    this.playersService.updateOne(p.id, { balance: p.balance + payment.amount / receiverPlayers.length })
                ))
            )
        ])

        return [
            ...updatedReceiverPlayers,
            updatedPayerPlayer
        ]
    }

    async executePayment(userId: string, paymentId: string): Promise<{ gameId: string, gameTurn?: GameTurn, players: Player[], gameFields: GameField[] }> {
        const [player, payment] = await Promise.all([
            this.playersService.findCurrentPlayerByUserId(userId),
            this.gamePaymentsService.findOneById(paymentId),
        ])
        if (!player) {
            throw new BadRequestException(`Failed to accept payment. User is not active player.`)
        }
        if (!payment) {
            throw new BadRequestException(`Failed to accept payment. Payment not found.`)
        }
        if (player.id !== payment.payerPlayerId) {
            throw new BadRequestException(`Failed to process payment. Player doesn't has this payment.`)
        }

        if (player.balance < payment.amount) {
            throw new BadRequestException(`Failed to accept payment. Player doesn't have enough money to pay.`)
        }

        let updates: { players: Player[], gameFields: GameField[] }
        switch (payment.type) {
            case GamePaymentType.BUY_GAME_FIELD: {
                const { player: updatedPlayer, gameField } = await this.executeGameFieldPurchase(player, payment)
                updates = {
                    players: [updatedPlayer],
                    gameFields: [gameField]
                }
                break
            }
            case GamePaymentType.PAY_TAX:
            case GamePaymentType.TO_BANK: {
                updates = {
                    players: [await this.executeToBankPayment(player, payment)],
                    gameFields: []
                }
                break
            }
            case GamePaymentType.PAY_RENT:
            case GamePaymentType.TO_PLAYER: {
                const [payer, receiver] = await this.executeToPlayerPayment(payment)
                updates = {
                    players: [payer, receiver],
                    gameFields: []
                }
                break
            }
            case GamePaymentType.TO_PLAYERS: {
                updates = {
                    players: await this.executeToPlayersPayment(payment),
                    gameFields: []
                }
                break
            }
            default: {
                throw new Error(`Cannot process payment: unsupported payment type ${payment.type}`)
            }
        }

        await this.gamePaymentsService.destroy(payment.id)

        const [gameTurn, allGameTurnPayments] = await Promise.all([
            this.gameTurnsService.getOneOrThrow(payment.gameTurnId),
            this.gamePaymentsService.findAllByGameTurnId(payment.gameTurnId)
        ])

        if (allGameTurnPayments.length !== 0) {
            return {
                ...updates,
                gameId: gameTurn.gameId
            }
        } else {
            return {
                ...updates,
                gameId: gameTurn.gameId,
                gameTurn: gameTurn.isDouble
                    ? await this.grantExtraTurn(gameTurn)
                    : await this.passGameTurnToNextPlayer(gameTurn)
            }
        }
    }

    // async processRefusePayment(userId: string, paymentId: string): Promise<any> {

    // }
}