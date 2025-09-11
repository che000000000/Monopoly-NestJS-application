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
import { GlobalChatsModule } from "../global-chat/global-chats.module";
import { GlobalChatGateway } from "./global-chat-gateway/global-chat.gateway";
import { GameFieldsModule } from "../game-fields/game-fields.module";
import { GamesMasterModule } from "../games-master/games-master.module";

@Module({
    imports: [
        UsersModule,
        ChatsModule,
        PregameRoomsModule,
        PregameRoomMembersModule,
        GamesMasterModule,
        GamesModule,
        PlayersModule,
        GameTurnsModule,
        GameFieldsModule,
        GlobalChatsModule,
        DataFormatterModule
    ],
    providers: [PregameRoomsGateway, GamesGateway, GlobalChatGateway],
    exports: [PregameRoomsGateway, GamesGateway, GlobalChatGateway]
})

export class GatewaysModule { }