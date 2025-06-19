import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { UsersService } from '../users/users.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player) private readonly playersRepository: typeof Player,
        private readonly usersService: UsersService
    ) { }

    async findPlayerById(player_id: string) {
        return await this.playersRepository.findOne({
            where: { id: player_id },
            raw: true
        })
    }

    async createPlayer(dto: CreatePlayerDto) {
        const foundUser = await this.usersService.findUserById(dto.userId)
        
        if(!foundUser) {
            throw new NotFoundException('User not found.')
        }
        
        const newPlayer = await this.playersRepository.create({
            userId: foundUser.id,
            matchId: dto.matchId
        })
    }
}