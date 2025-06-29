import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/models/game.model';
import { UsersService } from '../users/users.service';
import { PregameRoomsService } from '../pregame-rooms/pregame-rooms.service';
import { ChatsService } from '../chats/chats.service';
import { PlayersService } from '../players/players.service';
import { InitGameDto } from './dto/init-game.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { TiedTo } from 'src/models/chat.model';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { GameTurnsService } from '../game-turns/game-turns.service';
import { NextTurnDto } from './dto/next-turn.dto';
import { FormattedGame } from './interfaces/formatted-game.interface';
import { FormattedPlayer } from '../players/interfaces/formatted-player.interface';
import { Dices } from './interfaces/dices.interface';
import { MoveDto } from './dto/move.dto';
import { GameField } from 'src/models/game-field.model';
import { Player } from 'src/models/player.model';

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

    async formatGame(game: Game): Promise<FormattedGame> {
        return { id: game.id }
    }

    async findGame(gameId: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({
            where: {
                id: gameId
            },
            raw: true
        })
    }

    async findGameByUser(userId: string): Promise<Game | null> {
        const foundUser = await this.usersService.findUser(userId)
        if (!foundUser) return null

        return await this.gamesRepository.findOne({
            where: {
                id: foundUser.gameId
            },
            raw: true
        })
    }

    async getGame(gameId: string): Promise<Game> {
        const foundGame = await this.findGame(gameId)
        if (!foundGame) throw new NotFoundException(`Game doesn't exist.`)
        return foundGame
    }

    throwDices(): Dices {
        let dices = [0, 0]
        dices = dices.map(() => Math.floor(Math.random() * 6) + 1)

        return {
            dices,
            summ: dices[0] + dices[1],
            isDouble: dices[0] === dices[1] ? true : false
        }
    }

    async createGame(dto: CreateGameDto): Promise<Game> {
        return await this.gamesRepository.create({
            chatId: dto.chatId
        })
    }

    async initGame(dto: InitGameDto): Promise<{ game: FormattedGame, players: FormattedPlayer[], playersCount: number }> {
        const receivedUser = await this.usersService.getUser(dto.userId)
        if (!receivedUser.pregameRoomId) throw new BadRequestException(`User isn't in the pregame room.`)

        const [pregameRoom, pregameUsers] = await Promise.all([
            this.pregamesRoomsService.getRoom(receivedUser.pregameRoomId),
            this.usersService.findPregameRoomUsers({
                roomId: receivedUser.pregameRoomId
            })
        ])
        if (pregameRoom.ownerId !== receivedUser.id) throw new ForbiddenException(`User isn't owner of pregame room.`)
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
                    turnNumber: index,
                    fieldId: gameFields[0].id,
                    gameId: newGame.id,
                    userId: user.id
                })
            }),
        )

        const randomIndex = Math.floor(Math.random() * newPlayers.length)
        await this.gameTurnsService.createTurn({
            gameId: newGame.id,
            playerId: newPlayers[randomIndex].id
        })


        const [formattedPlayers, formattedGame] = await Promise.all([
            Promise.all(newPlayers.map(player => this.playersService.formatPlayer(player))),
            this.formatGame(newGame)
        ])

        return {
            game: formattedGame,
            players: formattedPlayers,
            playersCount: formattedPlayers.length
        }
    }

    async nextTurn(dto: NextTurnDto): Promise<FormattedPlayer> {
        const [gameTurn, gamePlayers] = await Promise.all([
            this.gameTurnsService.getTurnByGame(dto.gameId),
            this.playersService.getGamePlayers(dto.gameId)
        ])

        const turnOwner = gamePlayers.find(player => player.id === gameTurn.playerId)
        if (!turnOwner) throw new NotFoundException(`Player who has turn not found.`)

        let newTurnOwner: Player | null
        let nextTurnNumber = turnOwner.turnNumber + 1
        while (true) {
            if (nextTurnNumber >= gamePlayers.length) {
                nextTurnNumber = 0
            }

            newTurnOwner = await this.playersService.findPlayerByTurn(
                dto.gameId,
                nextTurnNumber
            )
            if (newTurnOwner) {
                break
            }

            nextTurnNumber++
        }

        await this.gameTurnsService.updatePlayerId(
            gameTurn.id,
            newTurnOwner.id
        )

        return this.playersService.formatPlayer(newTurnOwner)
    }

    async move(dto: MoveDto): Promise<{ player: FormattedPlayer; thrownDices: Dices }> {
        const [receivedPlayer, gameTurn] = await Promise.all([
            this.playersService.getPlayer(dto.playerId),
            this.gameTurnsService.getTurnByGame(dto.gameId)
        ])
        if (receivedPlayer.id !== gameTurn.playerId) throw new BadRequestException(`The user cannot move when it's not his turn.`)

        const thrownDices = this.throwDices()

        const updatedPlayer = await this.playersService.movePlayer({
            playerId: dto.playerId,
            dices: thrownDices
        })

        const formattedPlayer = await this.playersService.formatPlayer(updatedPlayer)

        return {
            player: formattedPlayer,
            thrownDices
        }
    }
}