import { Injectable } from '@nestjs/common';
import { Message } from 'src/models/message.model';
import { User } from 'src/models/user.model';
import { IGlobalChatMessage } from './interfaces/global-chat-message';

@Injectable()
export class GlobalChatFormatterService {
    public formatGlobalChatMessage(message: Message, user: User | null): IGlobalChatMessage {
        return {
            id: message.id,
            text: message.text,
            sender: user
                ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                }
                : null,
            createdAt: message.createdAt
        }
    }
}