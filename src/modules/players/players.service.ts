import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { CreatePlayerDto } from './dto/create-player.dto';
import { DestroyPlayerDto } from './dto/destroy-player.dto';
import { UsersService } from '../users/users.service';
import { FormattedPlayer } from './interfaces/formatted-player.interface';
import { UpdateFieldIdDto } from './dto/update-field-id.dto';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { GameTurnsService } from '../game-turns/game-turns.service';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player) private readonly playersRepository: typeof Player,
        private readonly usersService: UsersService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameTurnsService: GameTurnsService
    ) { }

    async formatPlayer(player: Player): Promise<FormattedPlayer> {
        const [receivedUser, gameTurn] = await Promise.all([
            this.usersService.getUser(player.userId),
            this.gameTurnsService.findTurnByGame(player.gameId)
        ])
        return {
            id: player.id,
            turnNumber: player.turnNumber,
            playerHaveTurn: gameTurn?.playerId === player.id ? true : false,
            user: {
                id: receivedUser.id,
                name: receivedUser.name,
                avatarUrl: receivedUser.avatarUrl,
                role: receivedUser.role
            },
            balance: player.balance,
            fieldId: player.fieldId
        }
    }

    async findPlayer(playerId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { id: playerId },
            raw: true
        })
    }

    async getPlayer(playerId: string): Promise<Player> {
        const receivedPlayer = await this.findPlayer(playerId)
        if (!receivedPlayer) throw new NotFoundException(`Player doesn't exists.`)
        return receivedPlayer
    }

    async getGamePlayers(gameId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({
            where: { gameId },
            raw: true
        })
    }

    async findPlayerByTurn(gameId: string, turnNumber: number): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                gameId,
                turnNumber
            },
            raw: true
        })
    }

    async findPlayerByUser(userId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                userId
            },
            raw: true
        })
    }

    async createPlayer(dto: CreatePlayerDto): Promise<Player> {
        return await this.playersRepository.create({
            hisTurn: dto.turnNumber === 1 ? true : false,
            turnNumber: dto.turnNumber,
            fieldId: dto.fieldId,
            gameId: dto.gameId,
            userId: dto.userId,
            balance: 1500
        })
    }

    async destroyPlayer(dto: DestroyPlayerDto): Promise<number> {
        return await this.playersRepository.destroy({
            where: { id: dto.playerId }
        })
    }

    async movePlayer(dto: UpdateFieldIdDto): Promise<Player> {
        const receivedPlayer = await this.getPlayer(dto.playerId)
        const currentField = await this.gameFieldsService.getField(receivedPlayer.fieldId)

        const nextFieldPosition = ((currentField.position - 1 + dto.dices.summ) % 40) + 1
        const nextField = await this.gameFieldsService.getFieldByPosition(
            receivedPlayer.gameId,
            nextFieldPosition
        )

        await this.playersRepository.update(
            { fieldId: nextField.id },
            { where: { id: receivedPlayer.id } }
        )

        return await this.getPlayer(receivedPlayer.id)
    }
}