import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { PlayersService } from '../players/players.service';
import { InitGameDto } from './dto/init-game.dto';
import { FormatedGame } from './interfaces/formated-game.interface';
import { FormatedPlayer } from './interfaces/formated-player.interface';
import { CreateGameDto } from './dto/create-game.dto';
import { TiedTo } from 'src/models/chat.model';
import { GameFieldsService } from '../game-fields/game-fields.service';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly chatsService: ChatsService,
        private readonly playersService: PlayersService,
        private readonly gameFieldsService: GameFieldsService
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

    async createGame(dto: CreateGameDto): Promise<Game> {
        return await this.gamesRepository.create({
            chatId: dto.chatId
        })
    }

    async initGame(dto: InitGameDto): Promise<{ game: FormatedGame, players: FormatedPlayer[] }> {
        const receivedUser = await this.usersService.getUser(dto.userId)
        if (!receivedUser.pregameRoomId) throw new BadRequestException(`User isn't in the pregame room.`)

        const pregameUsers = await this.usersService.findPregameRoomUsers({
            roomId: receivedUser.pregameRoomId
        })
        if (pregameUsers.length < 2) throw new BadRequestException(`Need more users to start game.`)

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.GAME
        })

        const newGame = await this.createGame({
            chatId: newChat.id
        })

        const gameFields = await this.gameFieldsService.createFields({
            gameId: newGame.id
        })

        await this.pregamesRoomsService.removeRoom({
            roomId: receivedUser.pregameRoomId
        })

        const newPlayers = await Promise.all(
            pregameUsers.map(async (user, index) => {
                await this.usersService.updateGameId({
                    userId: user.id,
                    gameId: newGame.id
                })

                return this.playersService.createPlayer({
                    turnNumber: index + 1,
                    fieldId: gameFields[0].id,
                    gameId: newGame.id,
                    userId: user.id
                })
            }),
        )

        const formatedPlayers = await Promise.all(
            newPlayers.map(async (player) => {
                const foundUser = await this.usersService.findUserById(player.userId)
                return {
                    id: player.id,
                    turnNumber: player.turnNumber,
                    user: foundUser ? {
                        id: foundUser.id,
                        name: foundUser.name,
                        avatarUrl: foundUser.avatarUrl,
                        role: foundUser.role
                    } : null,
                    fieldId: player.fieldId
                }
            })
        )

        return {
            game: {
                id: newGame.id
            },
            players: formatedPlayers
        }
    }
}