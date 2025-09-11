import { Module } from '@nestjs/common';
import { GameTurnsService } from './game-turns.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameTurn } from './model/game-turn';

@Module({
  imports: [SequelizeModule.forFeature([GameTurn])],
  providers: [GameTurnsService],
  exports: [GameTurnsService]
})

export class GameTurnsModule {}