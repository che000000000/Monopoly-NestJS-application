import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn } from 'src/models/game-turn.model';
import { CreateTurnDto } from './dto/create-turn.dto';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    async findTurnByGame(gameId: string): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({
            where: { gameId }
        })
    }

    async getTurnByGame(gameId: string): Promise<GameTurn> {
        const foundTurn = await this.findTurnByGame(gameId)
        if (!foundTurn) throw new NotFoundException(`Game turn doesn't exist.`)
        return foundTurn
    }

    async createTurn(dto: CreateTurnDto): Promise<GameTurn> {
        return await this.gameTurnsRepository.create({
            gameId: dto.gameId,
            playerId: dto.playerId
        })
    }

    async updatePlayerId(turnId: string, playerId: string): Promise<number> {
        const [affectedCount] = await this.gameTurnsRepository.update(
            { playerId },
            { where: { id: turnId } }
        )
        return affectedCount
    }
}