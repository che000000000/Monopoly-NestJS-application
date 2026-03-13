import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlayerCard } from './model/player-card.model';

@Injectable()
export class PlayerCardsService {
    constructor(@InjectModel(PlayerCard) private readonly playerCardsRepository: typeof PlayerCard) { }

    
}