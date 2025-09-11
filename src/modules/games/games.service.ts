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

    // async payTax(userId: string): Promise<any> {
    //     const player = await this.playersService.findCurrentPlayerByUserId(userId)
    //     if (!player) {
    //         throw new BadRequestException(`Failed to pay tax. User not in the game.`)
    //     }

    //     const [gameField, gameTurn] = await Promise.all([
    //         this.gameFieldsService.getOneOrThrow(player.gameFieldId),
    //         this.gameTurnsService.getOneByGameIdOrThrow(player.gameId)
    //     ])
    //     if (gameTurn.playerId !== player.id || gameTurn.stage !== GameTurnStage.PAY_TAX) {
    //         throw new BadRequestException(`Failed to buy game field. User has not game turn or incorrect game turn stage.`)
    //     }
    //     if (gameField.ownerPlayerId) {
    //         throw new BadRequestException(`Failed to buy game field. Game field has owner already.`)
    //     }
    // }
}