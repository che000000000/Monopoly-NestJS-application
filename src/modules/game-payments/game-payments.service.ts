import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GamePayment, GamePaymentType } from './model/game-payment';

@Injectable()
export class GamePaymentsService {
    constructor(@InjectModel(GamePayment) private readonly gamePaymentsRepository: typeof GamePayment) { }

    async findOne(id: string): Promise<GamePayment | null> {
        return await this.gamePaymentsRepository.findOne({
            where: { id }
        })
    }

    async getOneOrThrow(id: string): Promise<GamePayment> {
        const gamePayment = await this.findOne(id)
        if (!gamePayment) {
            throw new NotFoundException(`Failed to get game payment. Game payment not found.`)
        }
        return gamePayment
    }

    async create(type: GamePaymentType, amount: number): Promise<GamePayment> {
        return await this.gamePaymentsRepository.create({
            type,
            amount,
        })
    }

    async destroy(id: string): Promise<number> {
        return await this.gamePaymentsRepository.destroy({
            where: { id }
        })
    }
}