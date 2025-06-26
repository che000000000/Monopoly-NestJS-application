import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { PlayersService } from '../players/players.service';

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

    async findGameByUserId(user_id: string): Promise<Game | null> {
        const foundUser = await this.usersService.findUserById(user_id)
        if (!foundUser) return null

        return await this.gamesRepository.findOne({
            where: {
                id: foundUser.pregameRoomId
            },
            raw: true
        })
    }
}