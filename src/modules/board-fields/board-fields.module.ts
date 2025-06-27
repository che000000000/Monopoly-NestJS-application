import { Module } from '@nestjs/common';
import { BoardFieldsService } from './board-fields.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BoardField } from 'src/models/board-field.model';

@Module({
  imports: [SequelizeModule.forFeature([BoardField])],
  providers: [BoardFieldsService],
  exports: [BoardFieldsService]
})

export class BoardFieldsModule {}