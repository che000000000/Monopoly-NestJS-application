import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { UsersService } from '../users/users.service';
import { GameFieldsService } from '../game-fields/game-fields.service';
import { GameTurnsService } from '../game-turns/game-turns.service';
import { Game } from 'src/models/game.model';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player) private readonly playersRepository: typeof Player,
        private readonly usersService: UsersService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameTurnsService: GameTurnsService
    ) { }

    async find(playerId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({ where: { id: playerId } })
    }

    async findByUserId(userId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({ where: { userId } })
    }

    async findPlayersByGameId(gameId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({ where: { gameId } })
    }

    async findPlayerByTurn(gameId: string, turnNumber: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                gameId,
                turnNumber
            }
        })
    }

    async getOrThrow(playerId: string): Promise<Player> {
        const player = await this.find(playerId)
        if (!player) throw new NotFoundException(`Failed to get player. Player doesn't exist.`)
        return player
    }

    async create(gameId: string, userId: string, fieldId: string, turnNumber: number): Promise<Player> {
        return await this.playersRepository.create({
            gameId,
            userId,
            fieldId,
            turnNumber,
            balance: 1500,
        })
    }

    async dstroy(playerId: string): Promise<number> {
        return await this.playersRepository.destroy({ where: { id: playerId } })
    }

    async updateFieldId(playerId: string, fieldId: string): Promise<Player | null> {
        const [affectedCount] = await this.playersRepository.update(
            { fieldId },
            { where: { id: playerId } }
        )
        if (affectedCount !== 0) return await this.getOrThrow(playerId)
        else return null
    }

    async updateBalance(playerId: string, balance: number): Promise<Player | null> {
        const [affectedCount] = await this.playersRepository.update(
            { balance },
            { where: { id: playerId } }
        )
        if(affectedCount !== 0) return await this.getOrThrow(playerId)
        else return null
    }
}