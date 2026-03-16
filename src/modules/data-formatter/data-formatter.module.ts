import { Module } from '@nestjs/common';
import { PregameRoomsFormatterService } from './pregame-rooms/pregame-rooms-formatter.service';
import { GamesFormatterService } from './games/games-formatter.service';
import { GlobalChatFormatterService } from './global-chat/global-chat-formatter.service';
import { PlayersFormatterService } from './players/players-formatter.service';
import { UsersModule } from '../users/users.module';
import { PlayersModule } from '../players/players.module';
import { GamesModule } from '../games/games.module';
import { GameTurnsModule } from '../game-turns/game-turns.module';
import { ActionsCardsModule } from '../action-cards/action-cards.module';
import { ActionCardsFormatterService } from './action-cards/action-cards-formatter.service';
import { GameTurnsFormatterService } from './game-turns/game-turns-formatter.service';
import { GamePaymentsFormatterService } from './game-payments/game-payments-formatter.service';
import { GameFieldsModule } from '../game-fields/game-fields.module';
import { GameFieldsFormatterService } from './game-fields/game-fields-formatter.service';
import { GameChatFormatterService } from './game-chat/game-chat-formatter.service';
import { MessagesModule } from '../messages/messages.module';
import { ChatsModule } from '../chats/chats.module';
import { GamePaymentsModule } from '../game-payments/game-payments.module';
import { UsersFormatterService } from './users/users-formatter.service';
import { PregameRoomChatFormatterService } from './pregame-room-chat/pregame-room-chat-formatter.service';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';
import { PlayerCardsModule } from '../player-cards/player-cards.module';
import { PlayerCardsFormatterService } from './player-cards/player-cards-formatter.service';

@Module({
	imports: [
		UsersModule,
		GamesModule,
		PlayersModule,
		PlayerCardsModule,
		GameFieldsModule,
		GameTurnsModule,
		GamePaymentsModule,
		ActionsCardsModule,
		ChatsModule,
		MessagesModule,
		PregameRoomsModule,
		PregameRoomMembersModule
	],
	providers: [
		UsersFormatterService,
		PlayersFormatterService,
		PlayerCardsFormatterService,
		ActionCardsFormatterService,
		GamePaymentsFormatterService,
		GameTurnsFormatterService,
		GameFieldsFormatterService,
		GamesFormatterService,
		PregameRoomsFormatterService,
		PregameRoomChatFormatterService,
		GlobalChatFormatterService,
		GameChatFormatterService
	],
	exports: [
		UsersFormatterService,
		PlayersFormatterService,
		PlayerCardsFormatterService,
		GameFieldsFormatterService,
		GameTurnsFormatterService,
		GamePaymentsFormatterService,
		ActionCardsFormatterService,
		PregameRoomsFormatterService, 
		PregameRoomChatFormatterService,
		GamesFormatterService,
		GlobalChatFormatterService,
		GameChatFormatterService
	]
})

export class DataFormatterModule {}