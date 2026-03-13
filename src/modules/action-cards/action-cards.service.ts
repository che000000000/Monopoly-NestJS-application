import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

    async getRandomActiveActionCardOrThrow(gameId: string, deckType: ActionCardDeckType): Promise<ActionCard> {
        const activeActionCards = await this.getAllIsActiveByGameIdAndDeckTypeOrThrow(gameId, deckType)

        if(activeActionCards.length === 0) {
            throw new Error(`Failed to get random action card. activeActionCards is empty.`)
        }

        return activeActionCards[Math.floor(Math.random() * activeActionCards.length)]
    }

    async getAllIsActiveByGameIdAndDeckTypeOrThrow(gameId: string, deckType: ActionCardDeckType): Promise<ActionCard[]> {
        const actionCards = await this.findAllByGameIdAndDeckType(gameId, deckType)
        if (actionCards.length === 0) {
            throw new NotFoundException(`Failed to get all is active action cards by gameId: ${gameId} and deck type: ${deckType}.`)
        }

        const activeActionCards = actionCards.filter((actionCard: ActionCard) => actionCard.isActive)

        if (activeActionCards.length === 0) {
            return await this.activateActionCardsByGameIdAndDeckType(gameId, deckType)
        }

        return activeActionCards
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