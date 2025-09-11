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
import { GameField, GameFieldType } from 'src/models/game-field.model';
import { GameTurn, GameTurnStage } from 'src/models/game-turn.model';
import { Player, PlayerStatus } from 'src/models/player.model';
import { Game } from 'src/models/game.model';
import { PregameRoom } from 'src/models/pregame-room.model';
import { ChatType } from 'src/models/chat.model';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { Message } from 'src/models/message.model';
import { User } from 'src/models/user.model';
import { ChanceItemsService } from '../chance-items/chance-items.service';

@Injectable()
export class GamesMasterService {
    constructor(
        private readonly gamesService: GamesService,
        private readonly playersService: PlayersService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly chanceItemsService: ChanceItemsService,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly chatsService: ChatsService,
        private readonly messagesService: MessagesService
    ) { }

    async defineNextGameTurn(gameTurn: GameTurn): Promise<{ gameTurn: GameTurn, palyer: Player }> {
        const [gamePlayers, currentTurnPlayer] = await Promise.all([
            this.playersService.findAllByGameId(gameTurn.gameId),
            this.playersService.getOneOrThrow(gameTurn.playerId)
        ])

        const sortedPlayers = gamePlayers.sort((a, b) => a.turnNumber - b.turnNumber);

        const currentPlayerIndex = sortedPlayers.findIndex(player =>
            player.id === currentTurnPlayer.id
        )

        const nextPlayerIndex = (currentPlayerIndex + 1) % sortedPlayers.length

        const nextPlayer = sortedPlayers[nextPlayerIndex]

        await Promise.all([
            this.gameTurnsService.updatePlayerId(gameTurn.id, nextPlayer.id),
            this.gameTurnsService.updateStage(gameTurn.id, GameTurnStage.MOVE)
        ])

        const updatedGameTurn = await this.gameTurnsService.getOneOrThrow(gameTurn.id)

        return {
            gameTurn: updatedGameTurn,
            palyer: nextPlayer
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

        await this.playersService.updateFieldId(player.id, gameField.id)
        const updatedPlayer = await this.playersService.getOneOrThrow(player.id)

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
            this.chanceItemsService.createGameChanceItems(game.id)
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

    async getGameState(userId: string): Promise<{ game: Game, gameFields: GameField[], players: Player[], gameTurn: GameTurn }> {
        const currentPlayer = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!currentPlayer) {
            throw new BadRequestException(`Failed to get game state. User is not player of the game.`)
        }

        const [game, gameFields, players, gameTurn] = await Promise.all([
            this.gamesService.getOneOrThrow(currentPlayer.gameId),
            this.gameFieldsService.findAllByGameId(currentPlayer.gameId),
            this.playersService.findAllByGameId(currentPlayer.gameId),
            this.gameTurnsService.getOneByGameIdOrThrow(currentPlayer.gameId)
        ])

        return {
            game,
            gameFields,
            players,
            gameTurn
        }
    }

    private throwDices(): { dices: number[], summ: number } {
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
            summ
        }
    }

    async makeMove(userId: string): Promise<{
        game: Game, player: Player, newGameField: GameField, leftGameField: GameField, gameTurn: GameTurn,
        thrownDices: {
            dices: number[],
            summ: number
        }
    }> {
        const userAsPlayer = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!userAsPlayer) {
            throw new BadRequestException(`Failed to move. User not in the game.`)
        }

        const [currentGameTurn, currentGameField, game] = await Promise.all([
            this.gameTurnsService.getOneByGameIdOrThrow(userAsPlayer.gameId),
            this.gameFieldsService.getOneOrThrow(userAsPlayer.gameFieldId),
            this.gamesService.getOneOrThrow(userAsPlayer.gameId)
        ])

        if (currentGameTurn.playerId !== userAsPlayer.id) {
            throw new BadRequestException(`Failed to move. Player. Player has no right to move`)
        }
        if (currentGameTurn.stage !== GameTurnStage.MOVE) {
            throw new BadRequestException(`Failed to move. Player. Not move stage`)
        }

        const thrownDices = this.throwDices()

        const isCircleCompleted = currentGameField.position + thrownDices.summ > 40
        const newPosition = ((currentGameField.position + thrownDices.summ - 1) % 40) + 1;

        if (isCircleCompleted) {
            await Promise.all([
                this.playersService.updateBalance(userAsPlayer.id, userAsPlayer.balance + 200),
                this.playersService.updatePaymentForCircle(userAsPlayer.id, true)
            ])
        }

        const movePlayer = await this.movePlayer(userAsPlayer.id, newPosition)

        return {
            game,
            player: movePlayer.player,
            newGameField: movePlayer.newGameField,
            leftGameField: movePlayer.leftGameField,
            gameTurn: currentGameTurn,
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

    async buyGameField(userId: string): Promise<{ player: Player, gameField: GameField, gameTurn: GameTurn }> {
        const player = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!player) {
            throw new BadRequestException(`Failed to buy game field. User not in the game.`)
        }

        const [gameField, gameTurn] = await Promise.all([
            this.gameFieldsService.getOneOrThrow(player.gameFieldId),
            this.gameTurnsService.getOneByGameIdOrThrow(player.gameId)
        ])
        if (gameTurn.playerId !== player.id || gameTurn.stage !== GameTurnStage.BUY_GAME_FIELD) {
            throw new BadRequestException(`Failed to buy game field. User has not game turn or incorrect game turn stage.`)
        }
        if (gameField.ownerPlayerId) {
            throw new BadRequestException(`Failed to buy game field. Game field has owner already.`)
        }

        const purchasableTypes = [
            GameFieldType.PROPERTY,
            GameFieldType.RAILROAD,
            GameFieldType.UTILITY
        ]
        if (!purchasableTypes.includes(gameField.type) || !gameField.basePrice) {
            throw new BadRequestException(`Failed to buy game field. The field is not subject to purchase`)
        }
        if (gameField.basePrice > player.balance) {
            throw new BadRequestException(`Failed to buy game field. Not enough money to buy game field.`)
        }

        await Promise.all([
            this.gameFieldsService.updatePlayerOwnerId(gameField.id, player.id),
            this.playersService.updateBalance(player.id, player.balance - gameField.basePrice)
        ])

        const [updatedPlayer, boughtGameField] = await Promise.all([
            this.playersService.getOneOrThrow(player.id),
            this.gameFieldsService.getOneOrThrow(gameField.id)
        ])

        return {
            player: updatedPlayer,
            gameField: boughtGameField,
            gameTurn
        }
    }
}