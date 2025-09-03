import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';
import { GlobalChatsService } from './global-chats.service';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		ChatsModule,
		MessagesModule,
		UsersModule
	],
	providers: [GlobalChatsService],
	exports: [GlobalChatsService]
})

export class GlobalChatsModule { }