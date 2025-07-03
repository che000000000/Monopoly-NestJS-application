import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { PlayersService } from '../players/players.service';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { GameTurnsService } from '../game-turns/game-turns.service';
import { TiedTo } from 'src/models/chat.model';
import { Player } from 'src/models/player.model';
import { NewGame } from './interfaces/new-game.interface';
import { User } from 'src/models/user.model';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly usersService: UsersService,
        private readonly pregamesRoomsService: PregameRoomsService,
        private readonly chatsService: ChatsService,
        private readonly playersService: PlayersService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly gameFieldsService: GameFieldsService
    ) { }

    async create(chatId: string): Promise<Game> {
        return await this.gamesRepository.create({
            chatId
        })
    }

    async formatPlayer(player: Player) {
        const [playerAsUser, palyerGameField] = await Promise.all([
            this.usersService.getOrThrow(player.userId),
            this.gameFieldsService.getOrThrow(player.fieldId)
        ])
        
        return {
            id: player.id,
            balance: player.balance,
            user: {
                id: playerAsUser.id,
                name: playerAsUser.name,
                avatarUrl: playerAsUser.avatarUrl,
                role: playerAsUser.role
            },
            gameField: {
                id: palyerGameField.id,
                name: palyerGameField.name
            }
        }
    }

    async formatNewGame(game: Game, players: Player[]): Promise<NewGame> {
        const formattedPlayers = await Promise.all(
            players.map(async (player) => {
                return this.formatPlayer(player)
            })
        )
        return {
            id: game.id,
            players: formattedPlayers,
            createdAt: game.createdAt
        }
    }

    private async createPlayersForGame(gameId: string, user: User, fieldId: string, index: number): Promise<Player> {
        await this.usersService.updateGameId({userId: user.id, gameId: gameId})
        return await this.playersService.create(gameId, user.id, fieldId, index + 1)
    }

    async initGame(userId: string): Promise<{ game: Game, players: Player[] }> {
        const pregameRoom = await this.pregamesRoomsService.findByUser(userId)
        if (!pregameRoom) throw new BadRequestException(`Failed to create game. User isn't in the pregame room.`)
        if (pregameRoom.ownerId !== userId) throw new ForbiddenException(`Failed to create game. User isn't owner of the pregame room.`)

        const pregameRoomUsers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
        if (pregameRoomUsers.length < 2) throw new BadRequestException(`Failed to create game. Minimum 2 users required`)

        const newGameChat = await this.chatsService.createChat(TiedTo.GAME)
        const newGame = await this.create(newGameChat.id)
        const gameFields = await this.gameFieldsService.createGameFields(newGame.id)

        const players = await Promise.all(
            pregameRoomUsers.map(async (user, index) => {
                return this.createPlayersForGame(newGame.id, user, gameFields[0].id, index)
            })
        )

        return {
            game: newGame,
            players
        }
    }
}