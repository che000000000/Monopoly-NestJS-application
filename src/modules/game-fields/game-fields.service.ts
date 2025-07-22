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

    async find(gameFieldId: string): Promise<GameField | null> {
        return await this.gameFieldsRepository.findOne({ where: { id: gameFieldId } })
    }

    async findByPosition(game: Game, position: number): Promise<GameField | null> {
        return await this.gameFieldsRepository.findOne({
            where: {
                gameId: game.id,
                position
            }
        })
    }

    async getOrThrow(gameFieldId: string): Promise<GameField> {
        const gameField = await this.find(gameFieldId)
        if (!gameField) throw new NotFoundException(`Failet to get game field. Game field doesn't exists.`)
        return gameField
    }

    async getByPositionOrThrow(game: Game, position: number): Promise<GameField> {
        const gameField = await this.findByPosition(game, position)
        if (!gameField) throw new NotFoundException(`Failed to get game fiedl by position.`)
        return gameField
    }

    async create(dto: CreateFieldDto): Promise<GameField> {
        return await this.gameFieldsRepository.create({
            type: dto.type,
            position: dto.position,
            rent: dto.rent ?? null,
            name: dto.name,
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
                    type: field.type,
                    position: field.position,
                    rent: field.rent,
                    name: field.name,
                    basePrice: field.basePrice,
                    housePrice: field.housePrice,
                    buildsCount: field.buildsCount
                })
            })
        )

        return newFields
    }
}