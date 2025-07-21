import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from 'src/models/message.model';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message) private readonly messagesRepository: typeof Message,
    ) { }
    
    async findMessageById(messageId: string): Promise<Message | null> {
        return await this.messagesRepository.findOne({
            where: {
                id: messageId
            },
            raw: true
        })
    }

    async createMessage(userId: string, chatId: string, messageText: string): Promise<Message> {
        return await this.messagesRepository.create({
            userId,
            chatId,
            text: messageText
        })
    }

    async getChatMessagesCount(chatId: string): Promise<number> {
        return await this.messagesRepository.count({
            where: { chatId }
        })
    }

    async getChatMessagesPage(chatId: string, pageNumber: number, pageSize: number): Promise<Message[]> {
        const chatMessages = this.messagesRepository.findAll({
            where: {
                chatId: chatId
            },
            order: [['createdAt', 'DESC']],
            limit: pageSize ? pageSize : 12,
            offset: (pageNumber - 1) * pageSize,
            raw: true
        })

        return chatMessages
    }
}