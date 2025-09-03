import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player, PlayerChip, PlayerStatus } from 'src/models/player.model';
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

    async findOne(id: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { id }
        })
    }

    async findOneByUserId(userId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { userId }
        })
    }

    async findAllByGameId(gameId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({ where: { gameId } })
    }

    async findAllByGameFieldId(gameFieldId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({ where: { gameFieldId } })
    }

    async getOneOrThrow(id: string): Promise<Player> {
        const player = await this.findOne(id)
        if (!player) throw new NotFoundException(`Failed to get player. Player doesn't exist.`)
        return player
    }

    async create(gameId: string, userId: string, gameFieldId: string, chip: PlayerChip, status: PlayerStatus, turnNumber: number): Promise<Player> {
        return await this.playersRepository.create({
            gameId,
            userId,
            gameFieldId,
            chip,
            status,
            turnNumber,
            balance: 1500,
        })
    }

    async dstroy(playerId: string): Promise<number> {
        return await this.playersRepository.destroy({ where: { id: playerId } })
    }
}