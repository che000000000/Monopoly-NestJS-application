import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game } from 'src/modules/games/model/game';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
    ) { }

    async findOne(id: string): Promise<Game | null> {
        return await this.gamesRepository.findOne({
            where: { id }
        })
    }

    async getOneOrThrow(id: string): Promise<Game> {
        const foundGame = await this.findOne(id)
        if (!foundGame) throw new NotFoundException('Failed to get game.')
        return foundGame
    }

    async create(chatId: string): Promise<Game> {
        return await this.gamesRepository.create({
            chatId,
            houses: 32,
            hotels: 12
        })
    }

    private async getGamesTotalCount(): Promise<number> {
        return await this.gamesRepository.count()
    }

    async getGamesPage(pageNumber?: number | null, pageSize?: number | null): Promise<{ gamesList: Game[], totalCount: number }> {
        const options = {
            pageNumber: pageNumber ? pageNumber : 1,
            pageSize: pageSize ? pageSize : 12
        }

        return {
            gamesList: await this.gamesRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: options.pageSize,
                offset: (options.pageNumber - 1) * options.pageSize,
                raw: true
            }),
            totalCount: await this.getGamesTotalCount()
        }
    }
}