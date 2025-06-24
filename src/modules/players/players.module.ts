import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';

@Module({
  imports: [SequelizeModule.forFeature([Player])],
  providers: [PlayersService],
  exports: [PlayersService]
})

export class PlayersModule {}