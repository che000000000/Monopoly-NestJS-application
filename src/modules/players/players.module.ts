import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from 'src/modules/players/model/player';
import { UsersModule } from '../users/users.module';
import { GameFieldsModule } from '../game-fields/game-fields.module';
import { GameTurnsModule } from '../game-turns/game-turns.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Player]),
    UsersModule,
    GameFieldsModule,
    GameTurnsModule
  ],
  providers: [PlayersService],
  exports: [PlayersService]
})

export class PlayersModule {}