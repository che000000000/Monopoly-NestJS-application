import { Module } from '@nestjs/common';
import { PregameRoomsFormatterService } from './pregame-rooms/pregame-rooms-formatter.service';
import { GamesFormatterService } from './games/games-formatter.service';

@Module({
	providers: [PregameRoomsFormatterService, GamesFormatterService],
	exports: [PregameRoomsFormatterService, GamesFormatterService]
})

export class DataFormatterModule {}