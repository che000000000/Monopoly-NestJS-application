import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { Message } from 'src/modules/messages/model/message';
import { User } from 'src/modules/users/model/user.model';
import { Chat, ChatType } from '../chats/model/chat';

@Injectable()
export class GlobalChatsService {
    constructor(
        private readonly chatsService: ChatsService,
        private readonly messagesService: MessagesService,
        private readonly usersService: UsersService
    ) { }

    async findGlobalChatOrCreate(): Promise<Chat> {
        return await this.chatsService.findOneWhereChatTypeGlobal() ??
            await this.chatsService.create(ChatType.GLOBAL)
    }

    async getGlobalChatMessagesPage(pageNumber?: number, pageSize?: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const options = {
            pageNumber: pageNumber ? pageNumber : 1,
            pageSize: pageSize ? pageSize : 12
        }

        const globalChat = await this.findGlobalChatOrCreate()

        return await this.messagesService.getMessagesPage(globalChat.id, options.pageNumber, options.pageSize)
    }

    async sendGlobalChatMessage(userId: string, messageText: string): Promise<{ message: Message, user: User }> {
        const user = await this.usersService.findOne(userId)
        if (!user) {
            throw new InternalServerErrorException(`Failed to send global chat message. User not found`)
        }

        if (messageText.length === 0) {
            throw new BadRequestException(`Failed to send global chat message. Message text in empty.`)
        }

        const globalChat = await this.findGlobalChatOrCreate()

        return {
            message: await this.messagesService.create(userId, globalChat.id, messageText),
            user
        }
    }
}