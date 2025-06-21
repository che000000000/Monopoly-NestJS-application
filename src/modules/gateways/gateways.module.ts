import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { PregameRoomsModule } from "../pregame-rooms/pregame-rooms.module";
import { PregamesRoomsGateway } from "./pre-games.gateway";
import { MessagesModule } from "../messages/messages.module";
import { ChatMembersModule } from "../chat-members/chat-members.module";

@Module({
    imports: [
        ConfigModule, 
        forwardRef(() => UsersModule),
        forwardRef(() => PregameRoomsModule),
        forwardRef(() => MessagesModule),
        ChatMembersModule
    ],
    providers: [PregamesRoomsGateway, WsAuthGuard],
    exports: [PregamesRoomsGateway]
})

export class GatewaysModule { }