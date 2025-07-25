import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat, TiedTo } from 'src/models/chat.model';

@Injectable()
export class ChatsService {
    constructor(@InjectModel(Chat) private readonly chatsRepository: typeof Chat) { }

    async findChatById(chat_id: string): Promise<Chat | null> {
        return await this.chatsRepository.findOne({
            where: {
                id: chat_id
            },
            raw: true
        })
    }

    async create(tiedTo: TiedTo): Promise<Chat> {
        return await this.chatsRepository.create({
            tiedTo
        })
    }

    async destroy(chatId: string): Promise<number> {
        return await this.chatsRepository.destroy({
            where: {
                id: chatId
            }
        })
    }
}