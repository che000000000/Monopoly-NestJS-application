import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player, PlayerChip, PlayerStatus } from 'src/modules/players/model/player';
import { UsersService } from '../users/users.service';
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

    async findOneById(id: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { id }
        })
    }

    async getOneByIdOrThrow(id: string): Promise<Player> {
        const player = await this.findOneById(id)
        if (!player) {
            throw new NotFoundException(`Failed to get player by id: ${id}.`)
        }
        return player
    }

    async findOneByUserIdAndGameId(userId: string, gameId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { userId, gameId }
        })
    }

    async getOneByUserIdAndGameIdOrThrow(userId: string, gameId: string): Promise<Player> {
        const player = await this.findOneByUserIdAndGameId(userId, gameId)
        if (!player) {
            throw new Error(`Failed to get player by userId: ${userId} and gameId: ${gameId}.`)
        }
        return player
    }

    async findAllByUserId(userId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({
            where: { userId }
        })
    }

    async findCurrentPlayerByUserId(userId: string): Promise<Player | undefined> {
        const userPlayers = await this.findAllByUserId(userId)
        return userPlayers.find((player: Player) => player.status !== PlayerStatus.IS_LEFT)
    }

    async findAllByGameId(gameId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({ where: { gameId } })
    }

    async findAllByGameFieldId(gameFieldId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({ where: { gameFieldId } })
    }

    async findOneByGameIdAndTurnNumber(gameId: string, turnNumber: number): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                gameId,
                turnNumber
            }
        })
    }

    async create(params: Partial<Player>): Promise<Player> {
        try {
            return await this.playersRepository.create(params)
        } catch (error) {
            throw new Error(`Failed to create player. ${error.message}`)
        }
    }

    async destroy(id: string): Promise<number> {
        return await this.playersRepository.destroy({
            where: { id }
        })
    }

    async updateOne(id: string, updates: Partial<Player>): Promise<Player> {
        const player = await this.findOneById(id)
        if (!player) {
            throw new Error(`Failed to update player with id: ${id}. player not found`)
        }

        const [affectedCount, [updatedPlayer]] = await this.playersRepository.update(
            updates,
            { where: { id }, returning: true }
        )
        if (affectedCount === 0) {
            throw new Error(`player with id: ${id} wasn't updated. No fields were changed.`)
        }

        return updatedPlayer
    }
}