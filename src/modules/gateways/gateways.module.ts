import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { MessagesModule } from "../messages/messages.module";
import { ChatMembersModule } from "../chat-members/chat-members.module";
import { PregameChatsGateway } from "./pregame-chats.gateway";

@Module({
    imports: [
        ConfigModule, 
        forwardRef(() => UsersModule),
        forwardRef(() => PregameRoomsModule),
        forwardRef(() => MessagesModule),
        ChatMembersModule
    ],
    providers: [PregameChatsGateway, WsAuthGuard],
    exports: [PregameChatsGateway]
})

export class GatewaysModule { }