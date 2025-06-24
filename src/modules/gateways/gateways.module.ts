import { Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { UsersModule } from "../users/users.module";
import { PregameGateway } from "./pregame.gateway";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./game.gateway";

@Module({
    imports: [
        UsersModule,
        PregameRoomsModule,
        GamesModule
    ],
    providers: [PregameGateway, GamesGateway],
})

export class GatewaysModule { }