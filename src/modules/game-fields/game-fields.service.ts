import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateFieldDto } from './dto/create-field.dto';
import { GAME_FIELDS_DATA } from './data/game-fields';
import { GameField, GameFieldType } from './model/game-field';
import { Monopoly } from '../monopolies/model/monopoly';

@Injectable()
export class GameFieldsService {
    constructor(
        @InjectModel(GameField) private readonly gameFieldsRepository: typeof GameField
    ) { }

    async getOneOrThrow(id: string): Promise<GameField> {
        const gameField = await this.findOne(id)
        if (!gameField) throw new NotFoundException(`Failed to get game_field with id: ${id}.`)
        return gameField
    }

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

    async getOneByGameIdAndPosition(gameId: string, position: number): Promise<GameField> {
        const gameField = await this.findOneByGameIdAndPosition(gameId, position)
        if (!gameField) throw new NotFoundException(`Failed to get GameField by gameId:${gameId} and position: ${position}.`)
        return gameField
    }

    async findOneByGameIdAndPosition(gameId: string, position: number): Promise<GameField | null> {
        return await this.gameFieldsRepository.findOne({
            where: {
                gameId,
                position
            }
        })
    }

    async findAllByOwnerPlayerIdAndType(ownerPlayerId: string, type: GameFieldType): Promise<GameField[]> {
        return await this.gameFieldsRepository.findAll({
            where: { 
                ownerPlayerId, 
                type 
            }
        })
    }

    async findAllByGameIdAndType(gameId: string, type: GameFieldType): Promise<GameField[]> {
        return await this.gameFieldsRepository.findAll({
            where: {
                gameId,
                type
            }
        })
    }

    async findAllByMonopolyId(monopolyId: string): Promise<GameField[]> {
        return await this.gameFieldsRepository.findAll({
            where: { monopolyId }
        })
    }

    async create(dto: CreateFieldDto): Promise<GameField> {
        return await this.gameFieldsRepository.create({
            ...dto
        })
    }

    async createGameFields(gameId: string, monopolies: Monopoly[]): Promise<GameField[]> {
        const monopolyMap = new Map(
            monopolies.map(m => [m.color, m.id])
        )

        try {
            const result = await this.gameFieldsRepository.sequelize?.transaction(async (t) => {
                const newFields = await Promise.all(
                    GAME_FIELDS_DATA.map(async (field) => {
                        let monopolyId: string | null = null

                        if (field.color) {
                            const foundMonopolyId = monopolyMap.get(field.color)

                            if (!foundMonopolyId) {
                                throw new Error(`Monopoly not found for color ${field.color}`)
                            }

                            monopolyId = foundMonopolyId
                        }

                        return await this.gameFieldsRepository.create({
                            ...field,
                            gameId,
                            monopolyId
                        }, { transaction: t })
                    })
                )

                return newFields
            })

            return result || []
        } catch (error) {
            throw new Error(`Failed to create game fields: ${error.message}`)
        }
    }

    async updateOne(id: string, updates: Partial<GameField>): Promise<GameField> {
        const gameField = await this.findOne(id)
        if (!gameField) {
            throw new Error(`Failed to update gameField with id: ${id}. gameField not found`)
        }

        const [affectedCount, [updatedGameField]] = await this.gameFieldsRepository.update(
            updates,
            { 
                where: { id }, 
                returning: true 
            }
        )
        if (affectedCount === 0) {
            throw new Error(`gameField with id: ${id} wasn't updated. No fields were changed.`)
        }

        return updatedGameField
    }
}