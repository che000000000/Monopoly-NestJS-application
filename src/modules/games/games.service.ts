import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { CreateGameDto } from './dto/create-game.dto';
import { LeaveFromGameDto } from './dto/leave-from-game.dto';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { TiedTo } from 'src/models/chat.model';
import { ExceptionData } from '../gateways/types/exception-data.type';
import { ErrorTypes } from '../gateways/filters/WsExcepton.filter';
import { PlayersService } from '../players/players.service';
import { PregameRoom } from 'src/models/pregame-room.model';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly chatsService: ChatsService,
        private readonly playersService: PlayersService
    ) { }

    async findGameById(game_id: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({
            where: {
                id: game_id
            },
            raw: true
        })
    }

    async findRoomByUserId(user_id: string): Promise<Game | null> {
        const foundUser = await this.usersService.findUserById(user_id)
        if (!foundUser) return null

        return await this.gamesRepository.findOne({
            where: {
                id: foundUser.pregameRoomId
            },
            raw: true
        })
    }

    async createGame(dto: CreateGameDto): Promise<Game | ExceptionData> {
        const roomMembers = await this.usersService.findPregameRoomUsers({
            roomId: dto.roomId
        })
        if (roomMembers.length === 0) {
            return {
                errorType: ErrorTypes.Internal,
                message: `Room doesn't exist.`
            }
        }
        if (roomMembers.length < 2) {
            return {
                errorType: ErrorTypes.BadRequest,
                message: `Not enough users to start game.`
            }
        }

        const extractedUsersIds = roomMembers.map(user => user.id)

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.game,
            usersIds: extractedUsersIds
        })
        if(!newChat) {
            return {
                errorType: ErrorTypes.Internal,
                message: `Game chat wasn't created.`
            }
        }

        const newGame = await this.gamesRepository.create({
            chatId: newChat.id,
        })

        const newPlayers = await this.playersService.createGamePlayers({
            gameId: newGame.id,
            usersIds: extractedUsersIds
        })
        if(newPlayers.length !== extractedUsersIds.length) {
            return {
                errorType: ErrorTypes.Internal,
                message: `Failed to create some players.`
            }
        }

        return newGame
    }
}