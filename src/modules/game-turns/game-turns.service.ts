import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn } from 'src/models/game-turn.model';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    async find(turnId: string): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({ where: { id: turnId } })
    }

    async getOrThrow(turnId: string): Promise<GameTurn> {
        const gameTurn = await this.find(turnId)
        if (!gameTurn) throw new NotFoundException(`Failed to get game turn. Turn doesn't exist.`)
        return gameTurn
    }

    async create(gameId: string, playerId: string): Promise<GameTurn> {
        return await this.gameTurnsRepository.create({
            gameId,
            playerId
        })
    }
}