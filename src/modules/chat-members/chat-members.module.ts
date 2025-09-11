import { Module } from '@nestjs/common';
import { ChatMembersService } from './chat-members.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatMember } from 'src/modules/chat-members/model/chat-member';

@Module({
  imports: [
    SequelizeModule.forFeature([ChatMember]),
  ],
  providers: [ChatMembersService],
  exports: [ChatMembersService]
})

export class ChatMembersModule {}