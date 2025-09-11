import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActionCard } from './model/action-card';
import { ACTION_CARDS } from './data/ACTION_CARDS';
import { CreateActionCardDto } from './dto/create-action-card';

@Injectable()
export class ActionCardsService {
    constructor(@InjectModel(ActionCard) private readonly chanceItemsRepository: typeof ActionCard) { }

    async create(dto: CreateActionCardDto): Promise<ActionCard> {
        return await this.chanceItemsRepository.create({
            ...dto
        })
    }

    async createGameChanceItems(gameId: string): Promise<ActionCard[]> {
        const newFields = await Promise.all(
            ACTION_CARDS.map(async (actionCard) => {
                return await this.create({
                    ...actionCard,
                    gameId
                })
            })
        )

        return newFields
    }
}