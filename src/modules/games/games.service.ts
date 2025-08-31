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
import { Player, PlayerChip, PlayerStatus } from 'src/models/player.model';
import { PregameRoom } from 'src/models/pregame-room.model';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly chatsService: ChatsService,
        private readonly playersService: PlayersService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly gameFieldsService: GameFieldsService
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

    async create(): Promise<Game> {
        return await this.gamesRepository.create({
            houses: 32,
            hotels: 12
        })
    }

    async initGame(userId: string): Promise<{game: Game, gameFields: GameField[], players: Player[], pregameRoom: PregameRoom}> {
        const userAsPregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!userAsPregameRoomMember) {
            throw new BadRequestException(`Failed to start game. User not in the pregame room to start game.`)
        }
        if (!userAsPregameRoomMember.isOwner) {
            throw new BadRequestException(`Failed to start game. User is not pregame room owner.`)
        }

        const [pregameRoom, pregameRoomMembers, pregameRoomChat] = await Promise.all([
            this.pregamesRoomsService.findOne(userAsPregameRoomMember.pregameRoomId),
            this.pregameRoomMembersService.findAllByPregameRoomId(userAsPregameRoomMember.pregameRoomId),
            this.chatsService.findOneByPregameRoomId(userAsPregameRoomMember.pregameRoomId)
        ])
        if (!pregameRoom) {
            throw new InternalServerErrorException(`Failed to start game. Pregame room not found.`)
        }
        if (pregameRoomMembers.length < 2) {
            throw new BadRequestException(`Failed to start game. Incorrect members size to start game.`)
        }
        if (!pregameRoomChat) {
            throw new InternalServerErrorException(`Failed to start game. Pregame room chat not found.`)
        }

        const game = await this.create()

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

        await Promise.all([
            this.pregamesRoomsService.destroy(userAsPregameRoomMember.pregameRoomId),
            this.chatsService.linkToGame(pregameRoomChat.id, game.id)
        ])

        return {
            game,
            gameFields,
            players,
            pregameRoom
        }
    }
}