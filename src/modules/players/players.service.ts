import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player, PlayerColors } from 'src/models/player.model';
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

    async createGamePlayers(dto: CreatePlayerDto): Promise<Player[]> {
        let selectableColors: PlayerColors[] = [
            PlayerColors.BLUE,
            PlayerColors.GREEN,
            PlayerColors.PURPLE,
            PlayerColors.YELLOW
        ]

        return await Promise.all(dto.usersIds.map((userId, index) => {
            return this.playersRepository.create({
                hisTurn: false,
                number: index + 1,
                color: selectableColors[index],
                gameId: dto.gameId,
                userId: userId
            })
        }))
    }
}