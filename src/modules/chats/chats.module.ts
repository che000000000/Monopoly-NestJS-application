import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from 'src/models/chat.model';
import { ChatMembersModule } from '../chat-members/chat-members.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Chat]),
    forwardRef(() => ChatMembersModule) 
  ],
  providers: [ChatsService],
  exports: [ChatsService]
})

export class ChatsModule {}