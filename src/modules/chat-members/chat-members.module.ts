import { forwardRef, Module } from '@nestjs/common';
import { ChatMembersService } from './chat-members.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatsModule } from '../chats/chats.module';
import { ChatMember } from 'src/models/chat-members';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ChatMember]),
    forwardRef(() => ChatsModule),
    forwardRef(() => UsersModule)
  ],
  providers: [ChatMembersService],
  exports: [ChatMembersService]
})

export class ChatMembersModule {}