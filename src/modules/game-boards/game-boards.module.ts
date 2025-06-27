import { Module } from '@nestjs/common';
import { GameBoardsService } from './game-boards.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameBoard } from 'src/models/game-board.model';

@Module({
  imports: [SequelizeModule.forFeature([GameBoard])],
  providers: [GameBoardsService],
  exports: [GameBoardsService]
})

export class GameBoardsModule {}