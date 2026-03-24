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
import { Player } from 'src/modules/players/model/player';
import { Game } from 'src/modules/games/model/game';
import { PregameRoom } from 'src/modules/pregame-rooms/model/pregame-room';
import { Message } from 'src/modules/messages/model/message';
import { User } from 'src/modules/users/model/user.model';
import { ActionCardsService } from '../action-cards/action-cards.service';
import { ChatType } from '../chats/model/chat';
import { GameField, GameFieldType } from '../game-fields/model/game-field';
import { GameTurn, GameTurnStage } from '../game-turns/model/game-turn';
import { PregameRoomMember } from '../pregame-room-members/model/pregame-room-member';
import { ActionCard, ActionCardDeckType, ActionCardMoveDirection, ActionCardPropertyType, ActionCardType } from '../action-cards/model/action-card';
import { GamePaymentsService } from '../game-payments/game-payments.service';
import { GamePayment, GamePaymentType } from '../game-payments/model/game-payment';
import { ThrownDice } from './types/thrown-dice';
import { MonopoliesService } from '../monopolies/monopolies.service';

@Injectable()
export class GamesMasterService {
    constructor(
        private readonly gamesService: GamesService,
        private readonly playersService: PlayersService,
        private readonly monopoliesService: MonopoliesService,
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
    private readonly THROW_OF_DICE_DURATION = 1
    private readonly GO_TO_JAIL_DURATION = 3
    private readonly ACTION_CARD_DURATION = 5
    private readonly JAIL_POSITION = 11
    private readonly BUYOUT_FROM_JAIL_AMOUNT = 50

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

    async removeAllPropertyBuildingPayments(gameTurn: GameTurn): Promise<GameTurn> {
        await this.gamePaymentsService.removeAllByType(GamePaymentType.PROPERTY_BUILDING)
        return gameTurn
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

        const [newGame] = await Promise.all([
            this.gamesService.create(pregameRoomChat.id),
            this.chatsService.updateType(pregameRoomChat.id, ChatType.GAME)
        ])

        const newMonopolies = await this.monopoliesService.createMonopoliesForGame(newGame.id)

        const gameFields = await this.gameFieldsService.createGameFields(newGame.id, newMonopolies)

        const goField = gameFields.find((field: GameField) => field.type === GameFieldType.GO)
        if (!goField) {
            throw new InternalServerErrorException('Failed to start game. Go field not found.')
        }

        const [players] = await Promise.all([
            await Promise.all(pregameRoomMembers.map(async (member: PregameRoomMember, index) =>
                await this.playersService.create({
                    gameId: newGame.id,
                    userId: member.userId,
                    gameFieldId: goField.id,
                    chip: member.playerChip,
                    turnNumber: index + 1,
                    balance: 1500,
                })
            )),
            this.actionCardsService.createGameChanceItems(newGame.id)
        ])
        if (players.length === 0) {
            throw new InternalServerErrorException(`Failed to start game. Players not defined.`)
        }

        let turnOwnerPlayer = players.find((player: Player) => player.turnNumber === 1)
        if (!turnOwnerPlayer) {
            turnOwnerPlayer = players[0]
        }

        const gameTurn = await this.gameTurnsService.create({
            gameId: newGame.id,
            stage: GameTurnStage.MOVE,
            playerId: turnOwnerPlayer.id,
            expires: 30
        })

        await this.pregamesRoomsService.destroy(userAsPregameRoomMember.pregameRoomId)

        return {
            game: newGame,
            gameFields,
            players,
            gameTurn,
            pregameRoom
        }
    }

    async createBuildingPaymentsForMonopolies(gameTurn: GameTurn): Promise<GamePayment[]> {
        const monopolies = await this.monopoliesService.findAllByGameId(gameTurn.gameId)
        const monopoliesWithPlayer = monopolies.filter(m => m.playerId)

        const allPayments: GamePayment[] = []
        await Promise.all(
            monopoliesWithPlayer.map(async (m) => {
                const gameFieldsFromThisMonopoly = await this.gameFieldsService.findAllByMonopolyId(m.id)
                if (!gameFieldsFromThisMonopoly.length) {
                    throw new Error(`Failed to find gameFields of this monopoly: ${m.id}`)
                }

                const buildsCounts = gameFieldsFromThisMonopoly.map(gf => {
                    if (gf.buildsCount === null || gf.buildsCount < 0 || gf.buildsCount > 5) {
                        throw new Error(`Failed to define minimum of monopoly gameFields builds count. Incorrect buildsCount: ${gf.buildsCount} of gameField: ${gf.id}`)
                    }
                    return gf.buildsCount
                })

                const minGameFieldBuildsCount = Math.min(...buildsCounts)

                const monopolyPayments = await Promise.all(
                    gameFieldsFromThisMonopoly.map(async (gf) => {
                        if (gf.buildsCount === minGameFieldBuildsCount) {
                            if (!m.playerId) {
                                throw new Error(`Failed to create property building payment. Monopoly: ${m.id} playerId isn't defined.`)
                            }
                            if (!gf.housePrice) {
                                throw new Error(`Failed to create property building payment. The gameField: ${gf.id} doesn't contain housePrice.`)
                            }

                            return await this.gamePaymentsService.create({
                                type: GamePaymentType.PROPERTY_BUILDING,
                                payerPlayerId: m.playerId,
                                amount: gf.housePrice,
                                isOptional: true,
                                gameTurnId: gameTurn.id,
                                buildingPropertyGameFieldId: gf.id
                            })
                        } else {
                            return null
                        }
                    })
                )

                allPayments.push(...monopolyPayments.filter(payment => payment !== null))
            })
        )

        return allPayments
    }

    async passGameTurnToNextPlayer(gameTurn: GameTurn): Promise<GameTurn> {
        const activePlayers = await this.playersService.findAllActiveByGameId(gameTurn.gameId)
        const sortedActivePlayers = activePlayers.sort((a, b) => a.turnNumber - b.turnNumber)

        const currentPlayerIndex = sortedActivePlayers.findIndex((player: Player) =>
            player.id === gameTurn.playerId
        )
        const nextPlayerIndex = (currentPlayerIndex + 1) % sortedActivePlayers.length
        const nextPlayer = sortedActivePlayers[nextPlayerIndex]

        let stage: GameTurnStage = GameTurnStage.MOVE
        if (nextPlayer.atJail) {
            stage = GameTurnStage.AT_JAIL
        }

        const [nextGameTurn] = await Promise.all([
            this.gameTurnsService.create({
                gameId: gameTurn.gameId,
                playerId: nextPlayer.id,
                stage,
                expires: this.GAME_TURN_EXPIRES
            }),
            this.gameTurnsService.destroy(gameTurn.id)
        ])

        if (nextGameTurn.stage === GameTurnStage.AT_JAIL) {
            await this.gamePaymentsService.create({
                type: GamePaymentType.BUYOUT_FROM_JAIL,
                amount: this.BUYOUT_FROM_JAIL_AMOUNT,
                isOptional: true,
                payerPlayerId: nextGameTurn.playerId,
                gameTurnId: nextGameTurn.id
            })
        }

        await this.createBuildingPaymentsForMonopolies(nextGameTurn)

        return nextGameTurn
    }

    async grantExtraTurn(gameTurn: GameTurn): Promise<GameTurn> {
        const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

        const [newGameTurn] = await Promise.all([
            this.gameTurnsService.create({
                gameId: gameTurn.gameId,
                playerId: player.id,
                stage: GameTurnStage.MOVE,
                doublesCount: gameTurn.doublesCount,
                expires: this.GAME_TURN_EXPIRES
            }),
            this.gameTurnsService.destroy(gameTurn.id)
        ])

        await this.createBuildingPaymentsForMonopolies(newGameTurn)

        return newGameTurn
    }

    private throwDice(): ThrownDice {
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

    async movePlayer(playerId: string, position: number): Promise<{ player: Player, newGameField: GameField, leftGameField: GameField }> {
        const player = await this.playersService.findOneById(playerId)
        if (!player) {
            throw new Error(`Failed to move player. Player isn't found`)
        }

        const startingGameField = await this.gameFieldsService.getOneOrThrow(player.gameFieldId)

        const gameField = await this.gameFieldsService.findOneByGameIdAndPosition(player.gameId, position)
        if (!gameField) {
            throw new Error(`Failed to move player. The next gameField isn't found`)
        }

        const updatedPlayer = await this.playersService.updateOne(player.id, { gameFieldId: gameField.id })
        if (!updatedPlayer) {
            throw new Error(`Failed to move player. Player wasn't updated.`)
        }

        return {
            player: updatedPlayer,
            newGameField: gameField,
            leftGameField: startingGameField,
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

    async prepareGoToJailRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        return this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.GO_TO_JAIL, expires: this.GO_TO_JAIL_DURATION })
    }

    async prepareBuyoutFromJailRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.BUYOUT_FROM_JAIL, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.BUYOUT_FROM_JAIL,
                amount: 50,
                isOptional: false,
                payerPlayerId: gameTurn.playerId,
                gameTurnId: gameTurn.id
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
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null }),
                    await this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
                ])

                const updatedPlayer = await this.handleCircleCompletion(movePlayerResult.player, updatedGameTurn, fromGameField)

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
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null }),
                    this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
                ])

                const updatedPlayer = await this.handleCircleCompletion(movePlayerResult.player, updatedGameTurn, fromGameField)

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
                    this.gameTurnsService.updateOne(gameTurn.id, { stepsCount, actionCardId: null }),
                    this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
                ])

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

    async executeGoToJailActionCardRequirement(gameTurn: GameTurn): Promise<{ gameTurn: GameTurn, player: Player, gameFields: GameField[] }> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to execute GO_TO_JAIL actionCard requirement. gameTurn: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)
        if (actionCard.type !== ActionCardType.GO_TO_JAIL) {
            throw new Error(`Failed to execute GO_TO_JAIL actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }

        const { player, gameFields } = await this.executeGoToJail(gameTurn)

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { actionCardId: null }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return {
            gameTurn: updatedGameTurn,
            player,
            gameFields
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
        if (actionCard.type !== ActionCardType.GET_MONEY) {
            throw new Error(`Failed to execute GET_MONEY actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }
        if (!actionCard.amount) {
            throw new Error(`Failed to execute GET_MONEY actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        const [updatedGameTurn, updatedPlayer] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { actionCardId: null }),
            this.playersService.updateOne(gameTurn.playerId, { balance: player.balance + actionCard.amount }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return {
            gameTurn: updatedGameTurn,
            player: updatedPlayer
        }
    }

    async executeGetOutOfJailActionCardRequirement(gameTurn: GameTurn): Promise<{ gameTurn: GameTurn, player: Player }> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to execute GET_OUT_OF_JAIL actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const [actionCard, player] = await Promise.all([
            this.actionCardsService.getOneOrThrow(gameTurn.actionCardId),
            this.playersService.getOneByIdOrThrow(gameTurn.playerId)
        ])
        if (actionCard.type !== ActionCardType.GET_OUT_OF_JAIL) {
            throw new Error(`Failed to execute GO_TO_JAIL actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { actionCardId: null }),
            this.actionCardsService.updateOneById(actionCard.id, { playerId: player.id, isActive: false })
        ])

        return {
            gameTurn: updatedGameTurn,
            player
        }
    }

    async preparePayMoneyActionCardRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to prepare PAY_MONEY actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)
        if (actionCard.type !== ActionCardType.PAY_MONEY) {
            throw new Error(`Failed to execute PAY_MONEY actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }
        if (!actionCard.amount) {
            throw new Error(`Failed to prepare PAY_MONEY actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_MONEY, actionCardId: null, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.TO_BANK,
                payerPlayerId: gameTurn.playerId,
                amount: actionCard.amount,
                gameTurnId: gameTurn.id,
                isOptional: false
            }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return updatedGameTurn
    }

    async preparePayPlayersActionCardRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to prepare PAY_PLAYERS actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }
        const [actionCard, activePlayers] = await Promise.all([
            this.actionCardsService.getOneOrThrow(gameTurn.actionCardId),
            this.playersService.findAllActiveByGameId(gameTurn.gameId)
        ])
        if (actionCard.type !== ActionCardType.PAY_PLAYERS) {
            throw new Error(`Failed to execute PAY_PLAYERS actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }
        if (!actionCard.amount) {
            throw new Error(`Failed to prepare PAY_PLAYERS actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        const receiversPlayers = activePlayers.filter(p => p.id !== gameTurn.playerId)
        if (receiversPlayers.length === 0) {
            throw new Error(`Failed to prepare PAY_PLAYERS actionCard requirement. receiversPlayers not found.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_PLAYERS, actionCardId: null, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.TO_PLAYERS,
                payerPlayerId: gameTurn.playerId,
                amount: actionCard.amount * receiversPlayers.length,
                gameTurnId: gameTurn.id,
                isOptional: false
            }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return updatedGameTurn
    }

    async prepareGetPaymentFromPlayersActionCardRequirement(gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to prepare GET_PAYMENT_FROM_PLAYERS actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }

        const [actionCard, activePlayers] = await Promise.all([
            this.actionCardsService.getOneOrThrow(gameTurn.actionCardId),
            this.playersService.findAllActiveByGameId(gameTurn.gameId)
        ])
        if (actionCard.type !== ActionCardType.GET_PAYMENT_FROM_PLAYERS) {
            throw new Error(`Failed to execute GET_PAYMENT_FROM_PLAYERS actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }
        if (!actionCard.amount) {
            throw new Error(`Failed to prepare GET_PAYMENT_FROM_PLAYERS actionCard requirement. The actionCard ${actionCard.id} doesn't contain amount field.`)
        }

        const payingPlayers = activePlayers.filter(p => p.id !== gameTurn.playerId)
        if (payingPlayers.length === 0) {
            throw new Error(`Failed to prepare GET_PAYMENT_FROM_PLAYERS actionCard requirement. Paing players not found.`)
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.GET_PAYMENT_FROM_PLAYERS, actionCardId: null, expires: this.GAME_TURN_EXPIRES }),
            Promise.all(
                payingPlayers.map(p => (
                    this.gamePaymentsService.create({
                        type: GamePaymentType.ONE_OF_TO_PLAYER,
                        payerPlayerId: p.id,
                        receiverPlayerId: gameTurn.playerId,
                        amount: actionCard.amount,
                        gameTurnId: gameTurn.id,
                        isOptional: false
                    })
                ))
            ),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return updatedGameTurn
    }

    async preparePropertyRepairActionCardRequirements(gameTurn: GameTurn): Promise<GameTurn> {
        if (!gameTurn.actionCardId) {
            throw new Error(`Failed to prepare PROPERTY_REPAIR actionCard requirement. gameTurn with id: ${gameTurn.id} doesn't contain actionCardId.`)
        }

        const actionCard = await this.actionCardsService.getOneOrThrow(gameTurn.actionCardId)
        if (actionCard.type !== ActionCardType.PROPERTY_REPAIR) {
            throw new Error(`Failed to execute PROPERTY_REPAIR actionCard requirement. gameTurn: ${gameTurn.id} contain actionCard: ${actionCard.id} with wrong type: ${actionCard.type}.`)
        }
        if (!actionCard.houseCost || !actionCard.hotelCost) {
            throw new Error(`Failed to prepare PROPERTY_REPAIR actionCard requirement. The actionCard ${actionCard.id} doesn't contain the houseCost and hotelCost fields.`)
        }

        const playerProperties = await this.gameFieldsService.findAllByOwnerPlayerIdAndType(gameTurn.playerId, GameFieldType.PROPERTY)
        let finalAmount: number = 0
        playerProperties.map(pp => {
            const buildsCount = pp.buildsCount
            if (!buildsCount) return

            if (buildsCount !== 5) {
                finalAmount += actionCard.houseCost * buildsCount
            } else {
                finalAmount += actionCard.hotelCost
            }
        })

        if (!finalAmount) {
            await Promise.all([
                this.gameTurnsService.updateOne(gameTurn.id, { actionCardId: null }),
                this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
            ])

            if (gameTurn.isDouble) {
                return await this.grantExtraTurn(gameTurn)
            } else {
                return await this.passGameTurnToNextPlayer(gameTurn)
            }
        }

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, { stage: GameTurnStage.PAY_MONEY, actionCardId: null, expires: this.GAME_TURN_EXPIRES }),
            this.gamePaymentsService.create({
                type: GamePaymentType.TO_BANK,
                payerPlayerId: gameTurn.playerId,
                amount: finalAmount,
                gameTurnId: gameTurn.id,
                isOptional: false
            }),
            this.actionCardsService.updateOneById(actionCard.id, { isActive: false })
        ])

        return updatedGameTurn
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
            case GameFieldType.GO_TO_JAIL: {
                return this.prepareGoToJailRequirement(gameTurn)
            }
            default: return gameTurn.isDouble ? await this.grantExtraTurn(gameTurn) : await this.passGameTurnToNextPlayer(gameTurn)
        }
    }

    async executeGoToJail(gameTurn: GameTurn): Promise<{ player: Player, gameFields: GameField[] }> {
        const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)

        const makeMoveResult = await this.movePlayer(player.id, this.JAIL_POSITION)

        const updatedPlayer = await this.playersService.updateOne(player.id, { atJail: true, attemptsToGetOutOfJailCount: 0 })

        return {
            player: updatedPlayer,
            gameFields: [makeMoveResult.leftGameField, makeMoveResult.newGameField]
        }
    }

    async executeMovePlayerForDiceRoll(gameTurn: GameTurn): Promise<{ player: Player, fromGameField: GameField, toGameField: GameField }> {
        if (gameTurn.stage !== GameTurnStage.ROLL_OF_DICE_FOR_MOVE) {
            throw new Error(`Failed to executeMovePlayerForDiceRoll. gameTurn: ${gameTurn.id} have wrong stage: ${gameTurn.stage}.`)
        }
        if (!gameTurn.stepsCount) {
            throw new Error(`Failed to executeMovePlayerForDiceRoll. gameTurn: ${gameTurn.id} has inappropriate properties: stepsCount-${gameTurn.isDouble}.`)
        }

        const gameTurnPlayer = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)
        const fromGameField = await this.gameFieldsService.getOneOrThrow(gameTurnPlayer.gameFieldId)

        const nextPosition = (fromGameField.position - 1 + gameTurn.stepsCount) % this.BOARD_SIZE + 1

        const { player, leftGameField, newGameField } = await this.movePlayer(gameTurnPlayer.id, nextPosition)

        const updatedPlayer = await this.handleCircleCompletion(player, gameTurn, fromGameField)

        return {
            player: updatedPlayer,
            fromGameField: leftGameField,
            toGameField: newGameField
        }
    }

    async executeGettingOutOfJailForDiceRoll(gameTurn: GameTurn): Promise<{ player: Player, fromGameField: GameField, toGameField: GameField }> {
        if (gameTurn.stage !== GameTurnStage.ROLL_OF_DICE_FOR_GET_OUT_OF_JAIL) {
            throw new Error(`Failed to executeGettingOutOfJailForDice. gameTurn: ${gameTurn.id} have wrong stage: ${gameTurn.stage}.`)
        }
        if (!gameTurn.isDouble || !gameTurn.stepsCount) {
            throw new Error(`Failed to executeGettingOutOfJailForDice. gameTurn: ${gameTurn.id} has inappropriate properties: isDouble - ${gameTurn.isDouble}; stepsCount - ${gameTurn.stepsCount}.`)
        }

        const player = await this.playersService.getOneByIdOrThrow(gameTurn.playerId)
        const currentGameField = await this.gameFieldsService.getOneOrThrow(player.gameFieldId)
        if (currentGameField.type !== GameFieldType.JUST_VISITING) {
            throw new Error(`Failed to execute executeGettingOutOfJailForDice. The player isn't at jail.`)
        }

        const [moveResult] = await Promise.all([
            this.movePlayer(player.id, currentGameField.position + gameTurn.stepsCount),
            this.playersService.updateOne(player.id, { atJail: false, attemptsToGetOutOfJailCount: 0 })
        ])

        return {
            player: moveResult.player,
            fromGameField: moveResult.leftGameField,
            toGameField: moveResult.newGameField
        }
    }

    private async executeToBankPayment(player: Player, payment: GamePayment): Promise<Player> {
        return await this.playersService.updateOne(player.id, { balance: player.balance - payment.amount })
    }

    private async executeToPlayerPayment(payment: GamePayment): Promise<Player[]> {
        if (!payment.receiverPlayerId) {
            throw new Error(`Failed to executeToPlayerPayment. The payment doesn't contain receiverPlayerId.`)
        }

        const [payerPlayer, receiverPaymentPlayer] = await Promise.all([
            this.playersService.findOneById(payment.payerPlayerId),
            this.playersService.findOneById(payment.receiverPlayerId)
        ])
        if (!payerPlayer || payerPlayer.isActive !== true || !receiverPaymentPlayer || receiverPaymentPlayer.isActive !== true) {
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
        const receiverPlayers = players.filter(p => p.id !== payerPlayer.id && p.isActive !== false)

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

    async payThePayment(userId: string, paymentId: string): Promise<{ gameTurn?: GameTurn, gameId: string, players: Player[] }> {
        const [player, payment] = await Promise.all([
            this.playersService.findActivePlayerByUserId(userId),
            this.gamePaymentsService.findOneById(paymentId),
        ])
        if (!player) {
            throw new BadRequestException(`Failed to accept payment. User isn't an active player.`)
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

        let players: Player[] = []
        switch (payment.type) {
            case GamePaymentType.TO_BANK: {
                players = [await this.executeToBankPayment(player, payment)]
                break
            }
            case GamePaymentType.ONE_OF_TO_PLAYER: {
                players = await this.executeToPlayerPayment(payment)
                break
            }
            case GamePaymentType.TO_PLAYERS: {
                players = await this.executeToPlayersPayment(payment)
                break
            }
            default: {
                throw new BadRequestException(`Payment of this type: ${payment.type} cant't be processed.`)
            }
        }

        await this.gamePaymentsService.destroy(payment.id)

        const [gameTurn, allGameTurnPayments] = await Promise.all([
            this.gameTurnsService.getOneOrThrow(payment.gameTurnId),
            this.gamePaymentsService.findAllByGameTurnId(payment.gameTurnId)
        ])

        if (gameTurn.stage === GameTurnStage.GET_PAYMENT_FROM_PLAYERS) {
            const remainingPayments = allGameTurnPayments.filter(p => p.type === GamePaymentType.ONE_OF_TO_PLAYER)

            if (remainingPayments.length !== 0) {
                return {
                    gameId: gameTurn.gameId,
                    players
                }
            }
        }

        return {
            gameTurn: gameTurn.isDouble
                ? await this.grantExtraTurn(gameTurn)
                : await this.passGameTurnToNextPlayer(gameTurn),
            gameId: gameTurn.gameId,
            players
        }
    }

    async rollTheDiceForMove(userId: string): Promise<{ gameTurn: GameTurn, thrownDice: ThrownDice }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to throw dice for make move. User not in the game. The user isn't an active player.`)
        }

        const gameTurn = await this.gameTurnsService.getOneByGameIdOrThrow(player.gameId)
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to throw dice for make move. It isn't this player's turn now.`)
        }
        if (gameTurn.stage !== GameTurnStage.MOVE) {
            throw new BadRequestException(`Failed to throw dice for make move. Not move stage`)
        }

        const thrownDice = this.throwDice()

        const updatedGameTurn = await this.gameTurnsService.updateOne(gameTurn.id, {
            stage: GameTurnStage.ROLL_OF_DICE_FOR_MOVE,
            expires: this.THROW_OF_DICE_DURATION,
            stepsCount: thrownDice.summ,
            isDouble: thrownDice.isDouble,
            doublesCount: thrownDice.isDouble ? gameTurn.doublesCount + 1 : gameTurn.doublesCount
        })

        return {
            gameTurn: updatedGameTurn,
            thrownDice
        }
    }

    async rollDiceToGetOutOfJail(userId: string): Promise<{ gameTurn: GameTurn, thrownDice: ThrownDice }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to attempt get out of jail. User isn't an active player.`)
        }

        const gameTurn = await this.gameTurnsService.getOneByGameIdOrThrow(player.gameId)
        if (gameTurn.playerId !== player.id) {
            throw new Error(`Failed to attempt get out of jail. It's not this player's turn now.`)
        }
        if (gameTurn.stage !== GameTurnStage.AT_JAIL) {
            throw new Error(`Failed to attempt get out of jail. The gameTurn: ${gameTurn.id} have wrong stage: ${gameTurn.stage}.`)
        }

        const thrownDice = this.throwDice()

        const [updatedGameTurn] = await Promise.all([
            this.gameTurnsService.updateOne(gameTurn.id, {
                stage: GameTurnStage.ROLL_OF_DICE_FOR_GET_OUT_OF_JAIL,
                expires: this.THROW_OF_DICE_DURATION,
                stepsCount: thrownDice.summ,
                isDouble: thrownDice.isDouble,
                doublesCount: thrownDice.isDouble ? gameTurn.doublesCount + 1 : 0
            }),
            this.playersService.updateOne(player.id, { attemptsToGetOutOfJailCount: player.attemptsToGetOutOfJailCount + 1 })
        ])

        return {
            gameTurn: updatedGameTurn,
            thrownDice
        }
    }

    async buyoutFromJail(userId: string): Promise<{ gameTurn: GameTurn, player: Player }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to buyout from jail. User isn't an active player.`)
        }

        const [gameTurn, gamePayment] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gamePaymentsService.findOneByPayerPlayerIdAndType(player.id, GamePaymentType.BUYOUT_FROM_JAIL),
        ])
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to buyout from jail. It's not this player's turn now.`)
        }
        if (gameTurn.stage !== GameTurnStage.AT_JAIL && gameTurn.stage !== GameTurnStage.BUYOUT_FROM_JAIL) {
            throw new BadRequestException(`Failed to buyout from jail. The gameTurn: ${gameTurn.id} have wrong stage: ${gameTurn.stage}.`)
        }
        if (!gamePayment) {
            throw new Error(`Failed to buyoutFromJail. The gamePayment for the buyout from jail wasn't found.`)
        }
        if (gamePayment.amount > player.balance) {
            throw new BadRequestException(`Failed to buyout from jail. The player doesn't have enough money.`)
        }

        const [providedGameTurn, updatedPlayer] = await Promise.all([
            this.grantExtraTurn(gameTurn),
            this.playersService.updateOne(gameTurn.playerId, { balance: player.balance - gamePayment.amount, atJail: false, attemptsToGetOutOfJailCount: 0 })
        ])

        return {
            gameTurn: providedGameTurn,
            player: updatedPlayer
        }
    }

    async buyGameField(userId: string): Promise<{ gameTurn: GameTurn, player: Player, gameField: GameField }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to buy game field. User isn't as active player.`)
        }

        const [gameTurn, gamePayment, gameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gamePaymentsService.findOneByPayerPlayerIdAndType(player.id, GamePaymentType.BUY_GAME_FIELD),
            this.gameFieldsService.getOneOrThrow(player.gameFieldId)
        ])
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to buy game field. The player doesn't have the right to game turn.`)
        }
        if (gameTurn.stage !== GameTurnStage.BUY_GAME_FIELD) {
            throw new BadRequestException(`Failed to buy game field. Now isn't the right game turn stage to buy game field.`)
        }
        if (!gamePayment) {
            throw new Error(`Failed to buyGameField. The gamePayment for the gameField purchase wasn't found.`)
        }
        if (gamePayment.amount > player.balance) {
            throw new BadRequestException(`Failed to buy game field. The player doesn't have enough money.`)
        }

        const [updatedPlayer, updatedGameField] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount }),
            this.gameFieldsService.updateOne(gameField.id, { ownerPlayerId: player.id })
        ])

        if (gameField.monopolyId) {
            const gameFieldsFromMonopoly = await this.gameFieldsService.findAllByMonopolyId(gameField.monopolyId)
            const gameFieldsFromMonopolyByOwnPlayer = gameFieldsFromMonopoly.filter(gf => gf.ownerPlayerId === player.id)
            if (gameFieldsFromMonopoly.length === gameFieldsFromMonopolyByOwnPlayer.length) {
                await this.monopoliesService.updateOneById(gameField.monopolyId, { playerId: player.id })
            }
        }

        return {
            gameTurn: gameTurn.isDouble
                ? await this.grantExtraTurn(gameTurn)
                : await this.passGameTurnToNextPlayer(gameTurn),
            player: updatedPlayer,
            gameField: updatedGameField
        }
    }

    async payRent(userId: string): Promise<{ gameTurn: GameTurn, players: Player[] }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to pay rent. User isn't as active player.`)
        }

        const [gameTurn, gamePayment] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gamePaymentsService.findOneByPayerPlayerIdAndType(player.id, GamePaymentType.PAY_RENT)
        ])
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to pay rent. The player doesn't have the right to game turn.`)
        }
        if (gameTurn.stage !== GameTurnStage.PAY_RENT) {
            throw new BadRequestException(`Failed to pay rent. Now isn't the right game turn stage to pay rent.`)
        }
        if (!gamePayment) {
            throw new Error(`Failed to payRent. The gamePayment for to paying rent wasn't found.`)
        }
        if (!gamePayment.receiverPlayerId) {
            throw new Error(`Failed to payRent. The gamePayment has no a receiverPlayerId`)
        }
        if (gamePayment.amount > player.balance) {
            throw new BadRequestException(`Failed to pay rent. The player doesn't have enough money.`)
        }

        const receiverPlayer = await this.playersService.getOneByIdOrThrow(gamePayment.receiverPlayerId)

        const [updatedPayerPlayer, updatedReceiverPlayer] = await Promise.all([
            this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount }),
            this.playersService.updateOne(receiverPlayer.id, { balance: receiverPlayer.balance + gamePayment.amount }),
        ])

        return {
            gameTurn: gameTurn.isDouble
                ? await this.grantExtraTurn(gameTurn)
                : await this.passGameTurnToNextPlayer(gameTurn),
            players: [updatedPayerPlayer, updatedReceiverPlayer]
        }
    }

    async payTax(userId: string): Promise<{ gameTurn: GameTurn, player: Player }> {
        const player = await this.playersService.findActivePlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to pay tax. User isn't as active player.`)
        }

        const [gameTurn, gamePayment] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.gamePaymentsService.findOneByPayerPlayerIdAndType(player.id, GamePaymentType.PAY_TAX),
        ])
        if (gameTurn.playerId !== player.id) {
            throw new BadRequestException(`Failed to pay tax. The player doesn't have the right to game turn.`)
        }
        if (gameTurn.stage !== GameTurnStage.PAY_TAX) {
            throw new BadRequestException(`Failed to pay tax. Now isn't the right game turn stage to buy game field.`)
        }
        if (!gamePayment) {
            throw new Error(`Failed to payTax. The gamePayment for the pay tax wasn't found.`)
        }
        if (gamePayment.amount > player.balance) {
            throw new BadRequestException(`Failed to pay tax. The player doesn't have enough money.`)
        }

        const updatedPlayer = await this.playersService.updateOne(player.id, { balance: player.balance - gamePayment.amount })

        return {
            gameTurn: gameTurn.isDouble
                ? await this.grantExtraTurn(gameTurn)
                : await this.passGameTurnToNextPlayer(gameTurn),
            player: updatedPlayer
        }
    }

    async buildOnTheGameField(userId: string, gameFiledId: string): Promise<{ gameTurn: GameTurn, player: Player, gameField: GameField }> {
        const [player, gameField] = await Promise.all([
            this.playersService.findActivePlayerByUserId(userId),
            this.gameFieldsService.findOne(gameFiledId),
        ])
        if (!player) {
            throw new BadRequestException(`Failed to build on the field. User isn't as active player.`)
        }
        if (!gameField) {
            throw new BadRequestException(`Failed to build on the field. This field wasn't found.`)
        }

        const buildingPayment = await this.gamePaymentsService.findOneByPayerPlayerIdAndType(player.id, GamePaymentType.PROPERTY_BUILDING)
        if (!buildingPayment) {
            throw new BadRequestException(`Failed to build on the field. The game didn't give you the right to building on this field.`)
        }

        if (gameField.housePrice === null) {
            throw new Error(`Failed to buildOnTheGameField. The gameField: ${gameField.id} doesn't contain housePrice.`)
        }
        if (gameField.buildsCount === null) {
            throw new Error(`Failed to buildOnTheGameField. The gameField: ${gameField.id} doesn't contain buildsCount.`)
        }
        if (player.balance < gameField.housePrice) {
            throw new BadRequestException(`Failed to build on the field. The player doesn't have enough money.`)
        }

        const [gameTurn, updatedPlayer, updatedGameField] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId),
            this.playersService.updateOne(player.id, { balance: player.balance - gameField.housePrice }),
            this.gameFieldsService.updateOne(gameField.id, { buildsCount: gameField.buildsCount + 1 }),
            this.gamePaymentsService.removeAllByPayerPlayerIdAndType(player.id, GamePaymentType.PROPERTY_BUILDING)
        ])

        return {
            gameTurn,
            player: updatedPlayer,
            gameField: updatedGameField
        }
    }

    async getGameChatMessagesPage(userId: string, pageNumber: number, pageSize: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const currentPlayer = await this.playersService.findActivePlayerByUserId(userId)
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
            this.playersService.findActivePlayerByUserId(userId),
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
}