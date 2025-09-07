import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { PlayersService } from '../players/players.service';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { GameTurnsService } from '../game-turns/game-turns.service';
import { PregameRoomMembersService } from '../pregame-room-members/pregame-room-members.service';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { GameFieldType, GameField } from 'src/models/game-field.model';
import { Player, PlayerStatus } from 'src/models/player.model';
import { PregameRoom } from 'src/models/pregame-room.model';
import { MessagesService } from '../messages/messages.service';
import { Message } from 'src/models/message.model';
import { User } from 'src/models/user.model';
import { ChatType } from 'src/models/chat.model';
import { GameTurn, GameTurnStage } from 'src/models/game-turn.model';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly playersService: PlayersService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly chatsService: ChatsService,
        private readonly messagesService: MessagesService
    ) { }

    async findOne(id: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({
            where: { id }
        })
    }

    async getOneOrThrow(id: string): Promise<Game> {
        const foundGame = await this.findOne(id)
        if (!foundGame) throw new NotFoundException('Failed to get game.')
        return foundGame
    }

    async create(chatId: string): Promise<Game> {
        return await this.gamesRepository.create({
            chatId,
            houses: 32,
            hotels: 12
        })
    }

    private async getGamesTotalCount(): Promise<number> {
        return await this.gamesRepository.count()
    }

    async getGamesPage(pageNumber?: number | null, pageSize?: number | null): Promise<{ gamesList: Game[], totalCount: number }> {
        const options = {
            pageNumber: pageNumber ? pageNumber : 1,
            pageSize: pageSize ? pageSize : 12
        }

        return {
            gamesList: await this.gamesRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: options.pageSize,
                offset: (options.pageNumber - 1) * options.pageSize,
                raw: true
            }),
            totalCount: await this.getGamesTotalCount()
        }
    }

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
            throw new BadRequestException(`Failed to start game. Incorrect members size to start game.`)
        }

        const pregameRoomChat = await this.chatsService.findOne(pregameRoom.chatId)
        if (!pregameRoomChat) {
            throw new InternalServerErrorException(`Failed to start game. Pregame room chat not found.`)
        }

        const [game] = await Promise.all([
            this.create(pregameRoomChat.id),
            this.chatsService.updateType(pregameRoomChat.id, ChatType.GAME)
        ])

        const gameFields = await this.gameFieldsService.createGameFields(game.id)
        const goField = gameFields.find((field: GameField) => field.type === GameFieldType.GO)
        if (!goField) {
            throw new InternalServerErrorException('Failed to start game. Go field not found.')
        }

        const players = await Promise.all(pregameRoomMembers.map(async (member: PregameRoomMember, index) =>
            await this.playersService.create(game.id, member.userId, goField.id, member.playerChip, PlayerStatus.COMMON, index + 1)
        ))
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
            this.getOneOrThrow(currentPlayer.gameId),
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

    async movePlayer(userId: string): Promise<{ 
        game: Game, 
        player: Player, 
        newGameField: GameField, 
        leftGameField: GameField, 
        gameTurn: GameTurn, 
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
            this.getOneOrThrow(userAsPlayer.gameId)
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
            await this.playersService.updateBalance(userAsPlayer.id, userAsPlayer.balance + 200)
        }

        const newPositionGameField = await this.gameFieldsService.findOneByGameIdAndPosition(userAsPlayer.gameId, newPosition)
        if (!newPositionGameField) {
            throw new InternalServerErrorException(`Failed to move. New game field not found`)
        }

        await this.playersService.updateFieldId(userAsPlayer.id, newPositionGameField.id)
        const updatedPlayer = await this.playersService.getOneOrThrow(userAsPlayer.id)

        return {
            game,
            player: updatedPlayer,
            newGameField: newPositionGameField,
            leftGameField: currentGameField,
            gameTurn: currentGameTurn,
            thrownDices: thrownDices
        }
    }

    async getGameChatMessagesPage(userId: string, pageNumber: number, pageSize: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const currentPlayer = await this.playersService.findCurrentPlayerByUserId(userId)
        if (!currentPlayer) {
            throw new NotFoundException(`Failed to send game chat message. User not in the game.`)
        }

        const game = await this.getOneOrThrow(currentPlayer.gameId)

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

        const game = await this.getOneOrThrow(currentPlayer.gameId)

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