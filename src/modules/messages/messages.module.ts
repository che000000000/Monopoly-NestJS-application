import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Message } from 'src/models/message.model';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Message]),
    UsersModule,
    ChatsModule,
    ChatMembersModule
  ],
  providers: [MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}