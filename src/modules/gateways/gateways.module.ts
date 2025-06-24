import { forwardRef, Module } from "@nestjs/common";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { MessagesModule } from "../messages/messages.module";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./games.gateway";
import { PregameGateway } from "./pregame.gateway";
import { RedisModule } from "src/modules/redis/redis.module";
import { ChatMembersModule } from "../chat-members/chat-members.module";

@Module({
    imports: [
        forwardRef(() => PregameRoomsModule),
        forwardRef(() => UsersModule),
        MessagesModule,
        ChatMembersModule,
        forwardRef(() => GamesModule),
        RedisModule
    ],
    providers: [PregameGateway, GamesGateway],
    exports: [PregameGateway, GamesGateway]
})

export class GatewaysModule { }