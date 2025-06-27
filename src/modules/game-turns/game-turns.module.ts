import { Module } from '@nestjs/common';
import { GameTurnsService } from './game-turns.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameTurn } from 'src/models/game-turn.model';

@Module({
  imports: [SequelizeModule.forFeature([GameTurn])],
  providers: [GameTurnsService],
  exports: [GameTurnsService]
})

export class GameTurnsModule {}