import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActionCard, ActionCardDeckType } from './model/action-card';
import { ACTION_CARDS } from './data/ACTION_CARDS';
import { CreateActionCardDto } from './dto/create-action-card';

@Injectable()
export class ActionCardsService {
    constructor(@InjectModel(ActionCard) private readonly actionCardsRepository: typeof ActionCard) { }

    async findOne(id: string): Promise<ActionCard | null> {
        return await this.actionCardsRepository.findOne({
            where: { id }
        })
    }

    async getOneOrThrow(id: string): Promise<ActionCard> {
        const actionCard = await this.findOne(id)
        if (!actionCard) {
            throw new NotFoundException(`Failed to get one action card. Action card not found.`)
        }
        return actionCard
    }

    async create(dto: CreateActionCardDto): Promise<ActionCard> {
        return await this.actionCardsRepository.create({
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

    async getAllIsActiveByGameIdAndDeckTypeOrThrow(gameId: string, deckType: ActionCardDeckType): Promise<ActionCard[]> {
        const actionCards = await this.findAllByGameIdAndDeckType(gameId, deckType)
        if (actionCards.length === 0) {
            throw new NotFoundException(`Failed to get all is active action cards by game id and deck type.`)
        }

        if (actionCards.some((card: ActionCard) => card.isActive)) {
            return actionCards
        } else {
            return await this.activateActionCardsByGameIdAndDeckType(gameId, deckType)
        }
    }

    async findAllByGameIdAndDeckType(gameId: string, deckType: ActionCardDeckType): Promise<ActionCard[]> {
        return await this.actionCardsRepository.findAll({
            where: { gameId, deckType }
        })
    }

    private async activateActionCardsByGameIdAndDeckType(gameId: string, deckType: ActionCardDeckType): Promise<ActionCard[]> {
        await this.actionCardsRepository.update(
            { isActive: true },
            { where: { gameId, deckType } }
        )

        return await this.actionCardsRepository.findAll({
            where: { gameId, deckType }
        })
    }
}