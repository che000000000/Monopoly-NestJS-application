import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MatchesGateway } from "./matches.gateway";
import { UsersModule } from "../users/users.module";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { PregamesRoomsGateway } from "./pre-games.gateway";

@Module({
    imports: [ConfigModule, UsersModule, PregameRoomsModule],
    providers: [MatchesGateway, PregamesRoomsGateway, WsAuthGuard]
})

export class GatewaysModule { }