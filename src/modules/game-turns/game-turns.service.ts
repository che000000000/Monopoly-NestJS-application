import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn } from 'src/models/game-turn.model';
import { Game } from 'src/models/game.model';
import { Player } from 'src/models/player.model';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    async find(turnId: string): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({ where: { id: turnId } })
    }

    async findByGame(game: Game): Promise<GameTurn | null> {
        return await this.gameTurnsRepository.findOne({ where: { gameId: game.id } })
    }

    async getOrThrow(turnId: string): Promise<GameTurn> {
        const gameTurn = await this.find(turnId)
        if (!gameTurn) throw new NotFoundException(`Failed to get game turn. Turn doesn't exist.`)
        return gameTurn
    }

    async getByGameOrThrow(game: Game): Promise<GameTurn> {
        const foundGameTurn = await this.findByGame(game)
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

    async updatePlayerId(gameTurn: GameTurn, player: Player): Promise<number> {
        const [affectedCount] = await this.gameTurnsRepository.update(
            { playerId: player.id },
            { where: { id: gameTurn.id } }
        )
        return affectedCount
    }
}