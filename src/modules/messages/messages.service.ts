import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from 'src/models/message.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { GetMessagesPageDto } from './dto/find-chat-messages.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message) private readonly messagesRepository: typeof Message,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService
    ) { }
    
    async findMessageById(message_id: string): Promise<Message | null> {
        return await this.messagesRepository.findOne({
            where: {
                id: message_id
            },
            raw: true
        })
    }

    async createMessage(dto: CreateMessageDto): Promise<Message | null> {
        return await this.messagesRepository.create({
            userId: dto.userId,
            chatId: dto.chatId,
            text: dto.messageText
        })
    }

        async getMessagesPage(dto: GetMessagesPageDto): Promise<{messagesPage: Message[], totalCount: number}> {
        const [messagesPage, totalCount] = await Promise.all([
            this.messagesRepository.findAll({
                where: {
                    chatId: dto.chatId
                },
                order: [['createdAt', 'DESC']],
                limit: dto.pageSize ? dto.pageSize : 12,
                offset: (dto.pageNumber - 1) * dto.pageSize,
                raw: true
            }),
            this.messagesRepository.count()
        ])

        return { messagesPage, totalCount }
    }
}