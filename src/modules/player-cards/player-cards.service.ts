import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlayerCard } from './model/player-card.model';

@Injectable()
export class PlayerCardsService {
    constructor(@InjectModel(PlayerCard) private readonly playerCardsRepository: typeof PlayerCard) { }

    async findOneById(id: string): Promise<PlayerCard | null> {
        return await this.playerCardsRepository.findOne({
            where: { id }
        })
    }

    async getOneById(id: string): Promise<PlayerCard> {
        const playerCard = await this.findOneById(id)
        if (!playerCard) {
            throw new Error(`Failed to get one playerCard by id: ${id}. playerCard not found.`)
        }
        return playerCard
    }

    async findAllByPlayerId(playerId: string): Promise<PlayerCard[]> {
        return await this.playerCardsRepository.findAll({
            where: { playerId }
        })
    }
}