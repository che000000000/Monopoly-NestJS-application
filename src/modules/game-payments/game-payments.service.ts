import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GamePayment, GamePaymentType } from './model/game-payment';

@Injectable()
export class GamePaymentsService {
    constructor(@InjectModel(GamePayment) private readonly gamePaymentsRepository: typeof GamePayment) { }

    async findOneById(id: string): Promise<GamePayment | null> {
        try {
            return await this.gamePaymentsRepository.findOne({
                where: { id }
            })
        } catch (error) {
            throw new Error(`Failed to find one game payment by id. ${error.message}`)
        }
    }

    async getOneOrThrow(id: string): Promise<GamePayment> {
        const gamePayment = await this.findOneById(id)
        if (!gamePayment) {
            throw new NotFoundException(`Failed to get game payment. Game payment not found.`)
        }
        return gamePayment
    }

    async findOneByPayerPlayerIdAndType(payerPlayerId: string, type: GamePaymentType): Promise<GamePayment | null> {
        return await this.gamePaymentsRepository.findOne({
            where: {
                payerPlayerId,
                type
            }
        })
    }

    async getOneByPayerPlayerIdAndTypeOrThrow(payerPlayerId: string, type: GamePaymentType): Promise<GamePayment> {
        const gamePayment = await this.findOneByPayerPlayerIdAndType(
            payerPlayerId,
            type
        )
        if (!gamePayment) {
            throw new Error(`Failed to get GamePayment. payerPlayerId: ${payerPlayerId}; type: ${type}`)
        }

        return gamePayment
    }

    async findAllByGameTurnId(gameTurnId: string): Promise<GamePayment[]> {
        return await this.gamePaymentsRepository.findAll({
            where: { gameTurnId }
        })
    }

    async create(params: Partial<GamePayment>): Promise<GamePayment> {
        try {
            return await this.gamePaymentsRepository.create(params)
        } catch (error) {
            throw new Error(`Failed to create gamePayment. ${error.message}`)
        }
    }

    async destroy(id: string): Promise<number> {
        return await this.gamePaymentsRepository.destroy({
            where: { id }
        })
    }

    async removeAllByPayerPlayerIdAndType(payerPlayerId: string, type: GamePaymentType): Promise<number> {
        return await this.gamePaymentsRepository.destroy({
            where: { payerPlayerId, type }
        })
    }

    async removeAllByType(type: GamePaymentType): Promise<number> {
        return await this.gamePaymentsRepository.destroy({
            where: { type }
        })
    }
}