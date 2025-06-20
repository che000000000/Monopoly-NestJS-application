import { forwardRef, Module } from '@nestjs/common';
import { PregameRoomsService } from './pregame-rooms.service';
import { PregameRoomsController } from './pregame-rooms.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';

@Module({
    imports: [
        SequelizeModule.forFeature([PregameRoom]),
        forwardRef(() => UsersModule),
        ChatsModule,
        ChatMembersModule
    ],
    providers: [PregameRoomsService],
    controllers: [PregameRoomsController],
    exports: [PregameRoomsService]
})
export class PregameRoomsModule { }