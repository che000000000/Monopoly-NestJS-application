import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Monopoly, MonopolyColor } from './model/monopoly';

@Injectable()
export class MonopoliesService {
    constructor(
        @InjectModel(Monopoly) private readonly monopoliesRepository: typeof Monopoly
    ) { }

    async findOneById(id: string): Promise<Monopoly | null> {
        return await this.monopoliesRepository.findOne({
            where: { id }
        })
    }

    async findAllByGameId(gameId: string): Promise<Monopoly[]> {
        return await this.monopoliesRepository.findAll({
            where: { gameId }
        })
    }

    async createMonopoliesForGame(gameId: string): Promise<Monopoly[]> {
        const colors = Object.values(MonopolyColor)

        try {
            const newMonopolies = await this.monopoliesRepository.sequelize?.transaction(async (t) => {
                return await Promise.all(
                    colors.map(color => this.monopoliesRepository.create({
                        gameId,
                        color,
                        playerId: null
                    }, { transaction: t }))
                )
            })

            return newMonopolies || []
        } catch (error) {
            throw new Error(`Failed to create monopolies for game. Error message: ${error.message}`)
        }
    }

    async updateOneById(id: string, updates: Partial<Monopoly>): Promise<Monopoly> {
        const foundMonopoly = await this.findOneById(id)
        if (!foundMonopoly) {
            throw new Error(`Failed to update monopoly with id: ${id}. monopoly not found`)
        }

        const [affectedCount, [updatedGameField]] = await this.monopoliesRepository.update(
            updates,
            {
                where: { id },
                returning: true
            }
        )
        if (affectedCount === 0) {
            throw new Error(`The monopoly with id: ${id} wasn't updated. No fields were changed.`)
        }

        return updatedGameField
    }
}