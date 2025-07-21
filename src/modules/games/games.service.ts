import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
import { User } from 'src/models/user.model';
import { GameTurn } from 'src/models/game-turn.model';
import { GameField } from 'src/models/game-field.model';

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

    async find(gameId: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({ where: { id: gameId } })
    }

    async findByUser(user: User): Promise<Game | null> {
        return await this.gamesRepository.findOne({ where: { id: user.gameId } })
    }

    async getOrThrow(gameId: string): Promise<Game> {
        const foundGame = await this.find(gameId)
        if (!foundGame) throw new NotFoundException(`Failed to get game. Game not found.`)
        return foundGame
    }

    async getByUserOrThrow(user: User): Promise<Game> {
        const foundGame = await this.findByUser(user)
        if (!foundGame) throw new NotFoundException(`Failed to get game by user. Game not found or user isn't in the game.`)
        return foundGame
    }

    async create(chatId: string, playersSize: number): Promise<Game> {
        return await this.gamesRepository.create({
            chatId,
            playersSize
        })
    }

    private async createPlayerForGame(gameId: string, user: User, fieldId: string, turnNumber: number): Promise<Player> {
        const newPlayer = await this.playersService.create(gameId, user.id, fieldId, turnNumber)
        if (!newPlayer) throw new InternalServerErrorException(`Failed to create player.`)

        await this.usersService.updateGameId( user.id, gameId )
        return newPlayer
    }

    private async getRandomPlayer(players: Player[]): Promise<Player> {
        if (players.length === 0) throw new InternalServerErrorException(`Failed to get random player. Players not transfered.`)

        const randomPlayerIndex = Math.floor(Math.random() * players.length)
        return players[randomPlayerIndex]
    }

    private async defineTurn(game: Game, players: Player[]): Promise<GameTurn> {
        if(players.length === 0) throw new InternalServerErrorException(`Failed to define turn. Players not defined.`)

        const turnOwner = await this.getRandomPlayer(players)
        return this.gameTurnsService.create(game.id, turnOwner.id, 15)
    }

    private async createPlayersForNewGame(pregameRoomUsers: User[], game: Game, gameField: GameField): Promise<Player[]> {
        if (!game) throw new InternalServerErrorException(`Failed to create players for new game. Game entity not defined.`)
        if (pregameRoomUsers.length < 2) throw new InternalServerErrorException(`Failed to create players for new game. The required number of players was not transferred.`)
        if (!gameField) throw new InternalServerErrorException(`Failed to create players for new game. Started game field not defined.`)

        return await Promise.all(
            pregameRoomUsers.map(async (user, index) => {
                return this.createPlayerForGame(game.id, user, gameField.id, index + 1)
            })
        )
    }

    async initGame(userId: string): Promise<{ game: Game, players: Player[] }> {
        const pregameRoom = await this.pregamesRoomsService.findByUser(userId)
        if (!pregameRoom) throw new BadRequestException(`Failed to create game. User isn't in the pregame room.`)
        if (pregameRoom.ownerId !== userId) throw new ForbiddenException(`Failed to create game. User isn't owner of the pregame room.`)

        const pregameRoomUsers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
        if (pregameRoomUsers.length < 2) throw new BadRequestException(`Failed to create game. Minimum 2 users required`)

        const newGameChat = await this.chatsService.create(TiedTo.GAME)
        const newGame = await this.create(newGameChat.id, pregameRoomUsers.length)
        const gameFields = await this.gameFieldsService.createGameFields(newGame.id)

        const players = await this.createPlayersForNewGame(pregameRoomUsers, newGame, gameFields[0])

        await this.defineTurn(newGame, players)

        return {
            game: newGame,
            players
        }
    }

    async removeGame(game: Game): Promise<void> {
        await this.chatsService.destroy(game.chatId)
    }

    async getTurnWithPlayer(game: Game): Promise<{gameTurn: GameTurn, player: Player}> {
        const gameTurn = await this.gameTurnsService.getByGameOrThrow(game)
        const turnOwnerPlayer = await this.playersService.getOrThrow(gameTurn.playerId)
        return {
            gameTurn,
            player: turnOwnerPlayer
        }
    }

    async getNextPlayer(currentPlayer: Player): Promise<Player> {
        const receivedGame = await this.getOrThrow(currentPlayer.gameId)
        const players = await this.playersService.findPlayersByGame(receivedGame)
        if (players.length <= 1) throw new InternalServerErrorException(`Failed to define next player. Game players not found or remained one player.`)

        const sortedPlayers = [...players].sort((a, b) => a.turnNumber - b.turnNumber)

        const currentIndex = sortedPlayers.findIndex(p => p.id === currentPlayer.id)
        if (currentIndex === -1) {
            throw new InternalServerErrorException(`Current player not found in game players`)
        }

        const nextIndex = (currentIndex + 1) % sortedPlayers.length

        return sortedPlayers[nextIndex]
    }

    async setTurn(gameTurn: GameTurn, player: Player): Promise<{gameTurn: GameTurn, owner: Player}> {
        const affectedCount = await this.gameTurnsService.updatePlayerId(gameTurn, player)
        if (affectedCount === 0) throw new InternalServerErrorException(`Failed to set turn. Game turn playerId wasn't updated.`)

        const updatedGameTurn = await this.gameTurnsService.getOrThrow(gameTurn.id)
        return {
            gameTurn: updatedGameTurn,
            owner: player
        }
    }

    async removePlayerFromGame(player: Player): Promise<void> {
        await Promise.all([
            this.playersService.dstroy(player.id),
            this.usersService.updateGameId(player.userId, null)
        ])
    }

    async getGamePlayers(game: Game): Promise<Player[]> {
        return await this.playersService.findPlayersByGame(game)
    }

    async endGame(game: Game): Promise<Player> {
        const remainingPlayers = await this.getGamePlayers(game)
        if (remainingPlayers.length !== 1) throw new InternalServerErrorException(`Failed to end game. Remaineng players doesn't match.`)

        const winnerPlayer = remainingPlayers[0]

        await this.removeGame(game)
        return winnerPlayer
    }
}