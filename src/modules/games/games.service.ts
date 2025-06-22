import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { CreateGameDto } from './dto/create-game.dto';
import { LeaveFromGameDto } from './dto/leave-from-game.dto';
import { GamesGateway } from '../gateways/games.gateway';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { TiedTo } from 'src/models/chat.model';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        @Inject(forwardRef(() => GamesGateway)) private readonly gamesGateway: GamesGateway,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly chatsService: ChatsService
    ) { }

    async findGameById(game_id: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({
            where: {
                id: game_id
            },
            raw: true
        })
    }

    async findGameByUserId(user_id: string): Promise<Game | null> {
        const foundUser = await this.usersService.findUserById(user_id)

        return await this.gamesRepository.findOne({
            where: {
                id: foundUser?.gameId
            },
            raw: true
        })
    }

    async createGame(dto: CreateGameDto): Promise<Game | null> {
        const [foundRoom, foundUsers] = await Promise.all([
            this.pregamesRoomsService.findRoomById(dto.roomId),
            this.usersService.findPregameRoomUsers(dto.roomId),
        ])

        if (!foundRoom) {
            throw new BadRequestException('Room not found.')
        }
        if (foundRoom.ownerId !== dto.userId) {
            throw new ForbiddenException(`You're not owner of this room.`)
        }
        if (foundUsers.length === 0) {
            throw new BadRequestException(`Room hasn't members.`)
        }

        const usersIds = foundUsers.map(user => user.id)

        const newChat = await this.chatsService.createChat({
            usersIds: usersIds,
            tiedTo: TiedTo.game
        })
        if (!newChat) {
            throw new InternalServerErrorException(`Chat wasn't created.`)
        }

        const newGame = await this.gamesRepository.create({
            chatId: newChat.id
        })
        if (!newGame) throw new InternalServerErrorException(`Match wasn't created.`)

        Promise.all(usersIds.map(
            userId => {
                this.usersService.updateGameId({
                    gameId: newGame.id,
                    userId: userId
                })
            }
        ))

        await this.pregamesRoomsService.deletePregameRoom({
            userId: dto.userId,
        })

        return newGame
    }
}