import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameField } from 'src/models/game-field.model';
import { gameFieldsData } from './data/game-fields'
import { CreateFieldDto } from './dto/create-field.dto';
import { Game } from 'src/models/game.model';

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

    async getOneOrThrow(id: string): Promise<GameField> {
        const gameField = await this.findOne(id)
        if (!gameField) throw new NotFoundException(`Failet to get game field. Game field doesn't exists.`)
        return gameField
    }

    async create(dto: CreateFieldDto): Promise<GameField> {
        return await this.gameFieldsRepository.create({
            name: dto.name,
            type: dto.type,
            color: dto.color,
            position: dto.position,
            rent: dto.rent ?? null,
            basePrice: dto.basePrice ?? null,
            housePrice: dto.housePrice ?? null,
            buildsCount: dto.buildsCount ?? null,
            gameId: dto.gameId,
            ownerPlayerId: null
        })
    }

    async createGameFields(gameId: string): Promise<GameField[]> {
        const newFields = await Promise.all(
            gameFieldsData.map(async (field) => {
                return await this.create({
                    gameId,
                    name: field.name,
                    type: field.type,
                    color: field.color,
                    position: field.position,
                    rent: field.rent,
                    basePrice: field.basePrice,
                    housePrice: field.housePrice,
                    buildsCount: field.buildsCount
                })
            })
        )

        return newFields
    }
}