import { forwardRef, Module } from '@nestjs/common';
import { PregameRoomsService } from './pregame-rooms.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { GatewaysModule } from '../gateways/gateways.module';

@Module({
    imports: [
        SequelizeModule.forFeature([PregameRoom]),
        forwardRef(() => GatewaysModule),
        UsersModule,
        ChatsModule,
        ChatMembersModule,
    ],
    providers: [PregameRoomsService],
    exports: [PregameRoomsService]
})
export class PregameRoomsModule { }