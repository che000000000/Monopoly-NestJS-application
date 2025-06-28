import { Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { UsersModule } from "../users/users.module";
import { PregameGateway } from "./pregame.gateway";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./games.gateway";
import { PlayersModule } from "../players/players.module";
import { GameTurnsModule } from "../game-turns/game-turns.module";

@Module({
    imports: [
        UsersModule,
        PregameRoomsModule,
        GamesModule,
        GameTurnsModule,
        PlayersModule
    ],
    providers: [PregameGateway, GamesGateway],
    exports: [PregameGateway, GamesGateway]
})

export class GatewaysModule { }