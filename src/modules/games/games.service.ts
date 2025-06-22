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
}