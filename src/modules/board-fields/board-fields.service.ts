import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BoardField } from 'src/models/board-field.model';

@Injectable()
export class BoardFieldsService {
    constructor(
        @InjectModel(BoardField) private readonly boardFieldsRepository: typeof BoardField
    ) { }


}