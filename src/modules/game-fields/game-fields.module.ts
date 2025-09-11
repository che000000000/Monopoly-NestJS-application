import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameFieldsService } from './game-fields.service';
import { GameField } from './model/game-field';

@Module({
  imports: [SequelizeModule.forFeature([GameField])],
  providers: [GameFieldsService],
  exports: [GameFieldsService]
})

export class GameFieldsModule {}