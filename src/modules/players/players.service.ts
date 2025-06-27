import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player) private readonly playersRepository: typeof Player,
    ) { }

    async findPlayerByUserId(user_id: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                userId: user_id
            },
            raw: true
        })
    }

    async createPlayer(dto: CreatePlayerDto): Promise<Player> {
        return await this.playersRepository.create({
            hisTurn: false,
            turnNumber: dto.turnNumber,
            fieldId: dto.fieldId,
            gameId: dto.gameId,
            userId: dto.userId
        })
    }
}