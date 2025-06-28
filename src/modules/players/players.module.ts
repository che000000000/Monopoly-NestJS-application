import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { UsersModule } from '../users/users.module';
import { GameFieldsModule } from '../game-fields/game-fields.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Player]),
    UsersModule,
    GameFieldsModule
  ],
  providers: [PlayersService],
  exports: [PlayersService]
})

export class PlayersModule {}