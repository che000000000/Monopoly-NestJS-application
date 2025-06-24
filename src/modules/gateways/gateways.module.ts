import { forwardRef, Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { MessagesModule } from "../messages/messages.module";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";
import { PregameGateway } from "./pregame.gateway";
import { RedisModule } from "src/modules/redis/redis.module";
import { ChatMembersModule } from "../chat-members/chat-members.module";
import { GameGateway } from "./game.gateway";
import { PlayersModule } from "../players/players.module";
import { ChatsModule } from "../chats/chats.module";

@Module({
    imports: [
        forwardRef(() => UsersModule),
        forwardRef(() => PregameRoomsModule),
        ChatsModule,
        ChatMembersModule,
        MessagesModule,
        GamesModule,
        PlayersModule,
        RedisModule
    ],
    providers: [PregameGateway, GameGateway],
    exports: [PregameGateway, GameGateway]
})

export class GatewaysModule { }