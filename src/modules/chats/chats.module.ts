import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from './model/chat';

@Module({
  imports: [SequelizeModule.forFeature([Chat])],
  providers: [ChatsService],
  exports: [ChatsService]
})

export class ChatsModule {}