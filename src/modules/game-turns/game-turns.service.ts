import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn, GameTurnStage } from './model/game-turn';
import { ActionCard } from '../action-cards/model/action-card';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    async findOne(id: string): Promise<GameTurn | null> {
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
        const gameTurn = await this.findOne(id)
        if (!gameTurn) throw new NotFoundException(`Failed to get game turn. Turn doesn't exist.`)
        return gameTurn
    }

    async getOneByGameIdOrThrow(gameId: string): Promise<GameTurn> {
        const foundGameTurn = await this.findOneByGameId(gameId)
        if (!foundGameTurn) throw new NotFoundException(`Failed to get game turn by game.`)
        return foundGameTurn
    }

    async create(gameId: string, playerId: string, expires: number): Promise<GameTurn> {
        return await this.gameTurnsRepository.create({
            gameId,
            playerId,
            expires
        })
    }

    async destroy(id: string): Promise<number> {
        return await this.gameTurnsRepository.destroy({
            where: { id }
        })
    }

    async updateOne(id: string, updates: Partial<GameTurn>): Promise<GameTurn | null> {
        const [affectedCount, [updatedGameTurn]] = await this.gameTurnsRepository.update(
            updates,
            { where: { id }, returning: true }
        )
        return affectedCount > 0 ? updatedGameTurn : null
    }
}