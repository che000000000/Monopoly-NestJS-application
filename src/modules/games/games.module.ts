import { Module } from '@nestjs/common';
import { MatchesController } from './games.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Game} from 'src/models/game.model';
import { PlayersModule } from '../players/players.module';
import { GamesService } from './games.service';

@Module({
  imports: [SequelizeModule.forFeature([Game]), PlayersModule],
  providers: [GamesService],
  controllers: [MatchesController]
})
export class MatchesModule {}