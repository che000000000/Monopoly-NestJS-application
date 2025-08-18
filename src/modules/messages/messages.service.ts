import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from 'src/models/message.model';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message) private readonly messagesRepository: typeof Message,
    ) { }

    async findOneById(id: string): Promise<Message | null> {
        return await this.messagesRepository.findOne({
            where: { id }
        })
    }

    async create(userId: string, chatId: string, messageText: string): Promise<Message> {
        return await this.messagesRepository.create({
            userId, chatId, text: messageText
        })
    }

    async getChatMessagesCount(chatId: string): Promise<number> {
        return await this.messagesRepository.count({
            where: { chatId }
        })
    }

    async getPage(chatId: string, pageNumber: number, pageSize: number): Promise<{ messages: Message[], totalCount: number }> {
        const [messages, totalCount] = await Promise.all([
            this.messagesRepository.findAll({
                where: { chatId },
                order: [['createdAt', 'DESC']],
                limit: pageSize ? pageSize : 12,
                offset: (pageNumber - 1) * pageSize,
            }),
            this.getChatMessagesCount(chatId)
        ])

        return { messages, totalCount }
    }
}