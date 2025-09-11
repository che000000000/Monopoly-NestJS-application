import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn, GameTurnStage } from './model/game-turn';

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

    async updatePlayerId(id: string, playerId: string): Promise<number> {
        const [affectedCount] = await this.gameTurnsRepository.update(
            { playerId },
            { where: { id } }
        )
        return affectedCount
    }

    async updateStage(id: string, stage: GameTurnStage): Promise<number> {
        const [affectedCount] = await this.gameTurnsRepository.update(
            { stage },
            { where: { id } }
        )
        return affectedCount
    }

    async updateExpires(id: string, expires: number): Promise<number> {
        const [affectedCount] = await this.gameTurnsRepository.update(
            { expires },
            { where: { id } }
        )
        return affectedCount
    }
}