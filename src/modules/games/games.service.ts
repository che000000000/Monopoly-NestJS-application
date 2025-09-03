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

    async initGame(userId: string): Promise<{ game: Game, gameFields: GameField[], players: Player[], pregameRoom: PregameRoom }> {
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

        const [players] = await Promise.all([
            await Promise.all(pregameRoomMembers.map(async (member: PregameRoomMember, index) =>
                await this.playersService.create(game.id, member.userId, goField.id, member.playerChip, PlayerStatus.COMMON, index + 1)
            ))
        ])

        await this.pregamesRoomsService.destroy(userAsPregameRoomMember.pregameRoomId)

        return {
            game,
            gameFields,
            players,
            pregameRoom
        }
    }

    async getGameState(userId: string): Promise<{ game: Game, gameFields: GameField[], players: Player[] }> {
        const userAsPlayer = await this.playersService.findOneByUserId(userId)
        if (!userAsPlayer) {
            throw new BadRequestException(`Failed to get game state. User is not player of the game.`)
        }

        const [game, gameFields, players] = await Promise.all([
            this.getOneOrThrow(userAsPlayer.gameId),
            this.gameFieldsService.findAllByGameId(userAsPlayer.gameId),
            this.playersService.findAllByGameId(userAsPlayer.gameId),
        ])

        return {
            game,
            gameFields,
            players,
        }
    }

    async getGameChatMessagesPage(userId: string, pageNumber: number, pageSize: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const userAsPlayer = await this.playersService.findOneByUserId(userId)
        if (!userAsPlayer) {
            throw new BadRequestException(`Failed to get game chat messages page. User is not player.`)
        }

        const game = await this.getOneOrThrow(userAsPlayer.gameId)

        const gameChat = await this.chatsService.findOne(game.chatId)
        if (!gameChat) {
            throw new InternalServerErrorException('Failed to get pregame room messages page. Game chat not found.')
        }

        return await this.messagesService.getMessagesPage(gameChat.id, pageNumber, pageSize)
    }

    async sendGameChatMessage(userId: string, messageText: string): Promise<{ message: Message, user: User, player: Player, gameId: string }> {
        const [user, userAsPlayer] = await Promise.all([
            this.usersService.getOrThrow(userId),
            this.playersService.findOneByUserId(userId),
        ])
        if (!userAsPlayer) {
            throw new NotFoundException(`Failed to send game chat message. User is not player.`)
        }
        if (messageText.length === 0) {
            throw new BadRequestException(`Failed to send game chat message. Message text must not be empty.`)
        }

        const game = await this.getOneOrThrow(userAsPlayer.gameId)

        const gameChat = await this.chatsService.findOne(game.chatId)
        if (!gameChat) {
            throw new InternalServerErrorException(`Failed to send game chat message. Game chat not found.`)
        }

        const newMessage = await this.messagesService.create(user.id, gameChat.id, messageText)

        return {
            message: newMessage,
            user,
            player: userAsPlayer,
            gameId: userAsPlayer.gameId
        }
    }
}