import { Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { UsersModule } from "../users/users.module";
import { PregameRoomsGateway } from "./pregame-rooms.gateway";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./games.gateway";
import { PlayersModule } from "../players/players.module";
import { GameTurnsModule } from "../game-turns/game-turns.module";
import { PregameRoomMembersModule } from "../pregame-room-members/pregame-room-members.module";
import { DataFormatterModule } from "../data-formatter/data-formatter.module";

@Module({
    imports: [
        UsersModule,
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