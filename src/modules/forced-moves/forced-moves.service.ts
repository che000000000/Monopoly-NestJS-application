import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ForcedMove } from './model/forced-move';

@Injectable()
export class ForcedMovesService {
    constructor(
        @InjectModel(ForcedMove) private readonly forcedMovesRepository: typeof ForcedMove
    ) { }

    async findOneById(id: string): Promise<ForcedMove | null> {
        return await this.forcedMovesRepository.findOne({
            where: { id }
        })
    }

    async getOneById(id: string): Promise<ForcedMove> {
        const forcedMove = await this.findOneById(id)
        if (!forcedMove) {
            throw new Error(`Failed to get forcedMove with id: ${id}. forcedMove not found.`)
        }
        return forcedMove
    }

    async create(params: Partial<ForcedMove>): Promise<ForcedMove> {
        try {
            return await this.forcedMovesRepository.create(params)
        } catch (error) {
            throw new Error(`Failed to create forcedMove. ${error.message}`)
        }
    }

    async destroyById(id: string): Promise<number> {
        return this.forcedMovesRepository.destroy({
            where: { id }
        })
    }
}