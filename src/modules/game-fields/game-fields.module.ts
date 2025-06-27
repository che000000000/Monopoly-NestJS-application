import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameField } from 'src/models/game-field.model';
import { GameFieldsService } from './game-fields.service';

@Module({
  imports: [SequelizeModule.forFeature([GameField])],
  providers: [GameFieldsService],
  exports: [GameFieldsService]
})

export class GameFieldsModule {}