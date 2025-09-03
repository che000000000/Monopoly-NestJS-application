import { Module } from '@nestjs/common';
import { PregameRoomsFormatterService } from './pregame-rooms/pregame-rooms-formatter.service';
import { GamesFormatterService } from './games/games-formatter.service';
import { GlobalChatFormatterService } from './global-chat/global-chat-formatter.service';

@Module({
	providers: [
		PregameRoomsFormatterService, 
		GamesFormatterService,
		GlobalChatFormatterService
	],
	exports: [
		PregameRoomsFormatterService, 
		GamesFormatterService,
		GlobalChatFormatterService
	]
})

export class DataFormatterModule {}