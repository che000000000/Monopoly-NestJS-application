import { Injectable } from '@nestjs/common';
import { Message } from 'src/modules/messages/model/message';
import { User } from 'src/modules/users/model/user.model';
import { IGlobalChatMessage } from './interfaces/global-chat-message';
import { UsersService } from 'src/modules/users/users.service';
import { UsersFormatterService } from '../users/users-formatter.service';

@Injectable()
export class GlobalChatFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService
    ) { }

    formatGlobalChatMessage(message: Message, user?: User): IGlobalChatMessage {
        return {
            id: message.id,
            text: message.text,
            sender: user
                ? this.usersFormatterService.formatUser(user)
                : null,
            createdAt: message.createdAt
        }
    }

    async formatGlobalChatMessageAsync(message: Message): Promise<IGlobalChatMessage> {
        const user = message.userId
            ? await this.usersService.getOneOrThrow(message.userId)
            : undefined

        return this.formatGlobalChatMessage(message, user)
    }

    async formatGlobalChatMessagesAsync(messages: Message[]): Promise<IGlobalChatMessage[]> {
        return await Promise.all(
            messages.map(m => this.formatGlobalChatMessageAsync(m))
        )
    }
}