import { Module } from '@nestjs/common';
import { GamesMasterService } from './games-master.service';
import { GamesModule } from '../games/games.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';
import { PlayersModule } from '../players/players.module';
import { ChatsModule } from '../chats/chats.module';
import { GameTurnsModule } from '../game-turns/game-turns.module';
import { GameFieldsModule } from '../game-fields/game-fields.module';
import { MessagesModule } from '../messages/messages.module';
import { UsersModule } from '../users/users.module';
import { ChanceItemsModule } from '../chance-items/chance-items.module';

@Module({
	imports: [
		GamesModule,
		PlayersModule,
		GameFieldsModule,
		GameTurnsModule,
		ChanceItemsModule,
		UsersModule,
		MessagesModule,
		ChatsModule,
		PregameRoomsModule,
		PregameRoomMembersModule
	],
	providers: [GamesMasterService],
	exports: [GamesMasterService]
})

export class GamesMasterModule { }