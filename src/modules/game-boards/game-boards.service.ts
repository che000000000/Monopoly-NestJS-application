import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameBoard } from 'src/models/game-board.model';

@Injectable()
export class GameBoardsService {
    constructor(
        @InjectModel(GameBoard) private readonly gameBoardsRepository: typeof GameBoard
    ) { }


}