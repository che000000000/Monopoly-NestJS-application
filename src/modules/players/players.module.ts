import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';

@Module({
  imports: [SequelizeModule.forFeature([Player]), UsersModule],
  providers: [PlayersService],
  exports: [PlayersService]
})
export class PlayersModule { }
