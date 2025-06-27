import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameField } from 'src/models/game-field.model';

@Injectable()
export class GameFieldsService {
    constructor(
        @InjectModel(GameField) private readonly boardFieldsRepository: typeof GameField
    ) { }


}