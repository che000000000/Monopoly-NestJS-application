import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameTurn } from 'src/models/game-turn.model';

@Injectable()
export class GameTurnsService {
    constructor(
        @InjectModel(GameTurn) private readonly gameTurnsRepository: typeof GameTurn
    ) { }

    
}