import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Game} from 'src/models/game.model';
import { GamesService } from './games.service';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { PlayersModule } from '../players/players.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { GameFieldsModule } from '../game-fields/game-fields.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Game]),
    forwardRef(() => UsersModule),
    PregameRoomsModule,
    PlayersModule,
    ChatsModule,
    GameFieldsModule
  ],
  providers: [GamesService],
  exports: [GamesService]
})
export class GamesModule {}