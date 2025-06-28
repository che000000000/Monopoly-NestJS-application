import { forwardRef, Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { UsersModule } from "../users/users.module";
import { PregameGateway } from "./pregame.gateway";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./game.gateway";
import { PlayersModule } from "../players/players.module";

@Module({
    imports: [
        UsersModule,
        PregameRoomsModule,
        GamesModule,
        PlayersModule
    ],
    providers: [PregameGateway, GamesGateway],
    exports: [PregameGateway, GamesGateway]
})

export class GatewaysModule { }