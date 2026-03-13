import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn } from './model/game-turn';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    async findOneById(id: string): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({
            where: { id }
        })
    }

    async findOneByGameId(gameId: string): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({
            where: { gameId }
        })
    }

    async getOneOrThrow(id: string): Promise<GameTurn> {
        const gameTurn = await this.findOneById(id)
        if (!gameTurn) throw new NotFoundException(`Failed to get game turn. Turn doesn't exist.`)
        return gameTurn
    }

    async getOneByGameIdOrThrow(gameId: string): Promise<GameTurn> {
        const foundGameTurn = await this.findOneByGameId(gameId)
        if (!foundGameTurn) throw new NotFoundException(`Failed to get game turn by game.`)
        return foundGameTurn
    }

    async create(params: Partial<GameTurn>): Promise<GameTurn> {
        try {
            return await this.gameTurnsRepository.create(params)
        } catch (error) {
            throw new Error(`Failed to create gameTurn. ${error.message}`)
        }
    }

    async destroy(id: string): Promise<number> {
        return await this.gameTurnsRepository.destroy({
            where: { id }
        })
    }

    async updateOne(id: string, updates: Partial<GameTurn>): Promise<GameTurn> {
        const gameTurn = await this.findOneById(id)
        if (!gameTurn) {
            throw new Error(`Failed to update gameTurn with id: ${id}. gameTurn not found.`)
        }

        const [affectedCount, [updatedGameTurn]] = await this.gameTurnsRepository.update(
            updates,
            { where: { id }, returning: true }
        )
        if (affectedCount === 0) {
            throw new Error(`gameTurn with id: ${id} wasn't updated. No fields were changed.`)
        }

        return updatedGameTurn
    }
}