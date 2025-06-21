import { forwardRef, Module } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { MessagesModule } from "../messages/messages.module";
import { PregameChatsGateway } from "./pregame-chats.gateway";
import { UsersModule } from "../users/users.module";

@Module({
    imports: [
        forwardRef(() => PregameRoomsModule),
        forwardRef(() => UsersModule),
        MessagesModule
    ],
    providers: [PregameChatsGateway, WsAuthGuard],
    exports: [PregameChatsGateway]
})

export class GatewaysModule { }