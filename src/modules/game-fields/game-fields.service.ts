import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameField } from 'src/models/game-field.model';
import { CreateFieldsDto } from './dto/create-fields.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { gameFieldsData } from './data/game-fields'

@Injectable()
export class GameFieldsService {
    constructor(
        @InjectModel(GameField) private readonly gameFieldsRepository: typeof GameField
    ) { }

    async createField(dto: CreateFieldDto): Promise<GameField> {
        return await this.gameFieldsRepository.create({
            type: dto.fieldData.type,
            position: dto.fieldData.position,
            rent: dto.fieldData.rent,
            name: dto.fieldData.name,
            basePrice: dto.fieldData.basePrice,
            housePrice: dto.fieldData.housePrice,
            buildsCount: dto.fieldData.buildsCount,
            gameId: dto.gameId,
            ownerPlayerId: null
        })
    }

    async createFields(dto: CreateFieldsDto): Promise<GameField[]> {
        const newFields = await Promise.all(
            gameFieldsData.map(async (field) => {
                return await this.createField({
                    gameId: dto.gameId,
                    fieldData: {
                        type: field.type,
                        position: field.position,
                        rent: field.rent,
                        name: field.name,
                        basePrice: field.basePrice,
                        housePrice: field.housePrice,
                        buildsCount: field.buildsCount,
                    }
                })
            })
        )

        return newFields
    }
}