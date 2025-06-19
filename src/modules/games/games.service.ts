import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Game} from 'src/models/game.model';
import { PlayersService } from '../players/players.service';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(Game) private readonly gamesRepository: typeof Game,
        private readonly playersService: PlayersService
    ) { }

    async createMatch(dto: CreateGameDto) {
        const newMatch = await this.gamesRepository.create({})
        if(!newMatch) throw new InternalServerErrorException(`Match wasn't created.`)

        for(let i = 0; i < dto.usersIds.length; i++) {
            await this.playersService.createPlayer({
                matchId: newMatch.id,
                userId: dto.usersIds[i]
            })
        }
    }
}