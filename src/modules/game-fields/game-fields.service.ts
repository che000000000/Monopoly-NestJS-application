import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateFieldDto } from './dto/create-field.dto';
import { GAME_FIELDS_DATA } from './data/game-fields';
import { GameField } from './model/game-field';

@Injectable()
export class GameFieldsService {
    constructor(
        @InjectModel(GameField) private readonly gameFieldsRepository: typeof GameField
    ) { }

    async findOne(id: string): Promise<GameField | null> {
        return await this.gameFieldsRepository.findOne({
            where: { id }
        })
    }

    async findAllByGameId(gameId: string): Promise<GameField[]> {
        return await this.gameFieldsRepository.findAll({
            where: { gameId }
        })
    }

    async findOneByGameIdAndPosition(gameId: string, position: number): Promise<GameField | null> {
        return await this.gameFieldsRepository.findOne({
            where: {
                gameId,
                position
            }
        })
    }

    async getOneOrThrow(id: string): Promise<GameField> {
        const gameField = await this.findOne(id)
        if (!gameField) throw new NotFoundException(`Failet to get game field. Game field doesn't exists.`)
        return gameField
    }

    async create(dto: CreateFieldDto): Promise<GameField> {
        return await this.gameFieldsRepository.create({
            ...dto
        })
    }

    async createGameFields(gameId: string): Promise<GameField[]> {
        const newFields = await Promise.all(
            GAME_FIELDS_DATA.map(async (field) => {
                return await this.create({
                    ...field,
                    gameId
                })
            })
        )

        return newFields
    }

    async updatePlayerOwnerId(id: string, ownerPlayerId: string): Promise<number> {
        const [affectedCount] = await this.gameFieldsRepository.update(
            { ownerPlayerId },
            { where: { id } }
        )
        return affectedCount
    }
}