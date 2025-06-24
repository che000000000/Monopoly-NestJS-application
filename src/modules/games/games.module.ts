import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Game} from 'src/models/game.model';
import { GamesService } from './games.service';
import { UsersModule } from '../users/users.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { ChatsModule } from '../chats/chats.module';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Game]),
    forwardRef(() => UsersModule),
    forwardRef(() => GatewaysModule),
    forwardRef(() => PregameRoomsModule),
    PlayersModule,
    ChatsModule
  ],
  providers: [GamesService],
  exports: [GamesService]
})
export class GamesModule {}