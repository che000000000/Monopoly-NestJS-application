import { Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./games-gateway/games.gateway";
import { PlayersModule } from "../players/players.module";
import { GameTurnsModule } from "../game-turns/game-turns.module";
import { PregameRoomMembersModule } from "../pregame-room-members/pregame-room-members.module";
import { DataFormatterModule } from "../data-formatter/data-formatter.module";
import { PregameRoomsGateway } from "./pregame-rooms-gateway/pregame-rooms.gateway";
import { ChatsModule } from "../chats/chats.module";

@Module({
    imports: [
        UsersModule,
        ChatsModule,
        PregameRoomsModule,
        PregameRoomMembersModule,
        GamesModule,
        PlayersModule,
        GameTurnsModule,
        DataFormatterModule
    ],
    providers: [PregameRoomsGateway, GamesGateway],
    exports: [PregameRoomsGateway, GamesGateway]
})

export class GatewaysModule { }