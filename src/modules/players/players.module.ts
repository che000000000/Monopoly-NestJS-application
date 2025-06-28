import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Player]),
    UsersModule
  ],
  providers: [PlayersService],
  exports: [PlayersService]
})

export class PlayersModule {}