import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Game} from 'src/models/game.model';
import { GamesService } from './games.service';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { PlayersModule } from '../players/players.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { GameFieldsModule } from '../game-fields/game-fields.module';
import { GameTurnsModule } from '../game-turns/game-turns.module';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Game]),
    forwardRef(() => UsersModule),
    PregameRoomsModule,
    PregameRoomMembersModule,
    PlayersModule,
    GameTurnsModule,
    ChatsModule,
    GameFieldsModule
  ],
  providers: [GamesService],
  exports: [GamesService]
})
export class GamesModule {}