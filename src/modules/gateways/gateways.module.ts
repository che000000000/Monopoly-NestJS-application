import { forwardRef, Module } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { MessagesModule } from "../messages/messages.module";
import { PregameChatsGateway } from "./pregame-chats.gateway";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";
import { GamesGateway } from "./games.gateway";

@Module({
    imports: [
        forwardRef(() => PregameRoomsModule),
        forwardRef(() => UsersModule),
        MessagesModule,
        forwardRef(() => GamesModule)
    ],
    providers: [PregameChatsGateway, GamesGateway, WsAuthGuard],
    exports: [PregameChatsGateway, GamesGateway]
})

export class GatewaysModule { }