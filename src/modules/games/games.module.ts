import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Game} from 'src/modules/games/model/game';
import { GamesService } from './games.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Game]),
    forwardRef(() => UsersModule),
  ],
  providers: [GamesService],
  exports: [GamesService]
})
export class GamesModule {}