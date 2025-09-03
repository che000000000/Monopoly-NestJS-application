import { Module } from '@nestjs/common';
import { PregameRoomsService } from './pregame-rooms.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { MessagesModule } from '../messages/messages.module';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';
import { PlayersModule } from '../players/players.module';

@Module({
    imports: [
        SequelizeModule.forFeature([PregameRoom]),
        PregameRoomMembersModule,
        UsersModule,
        PlayersModule,
        ChatsModule,
        MessagesModule
    ],
    providers: [PregameRoomsService],
    exports: [PregameRoomsService]
})
export class PregameRoomsModule { }