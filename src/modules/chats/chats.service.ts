import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat } from 'src/models/chat.model';
import { CreateChatDto } from './dto/create-chat.dto';
import { DeleteChatDto } from './dto/delete-chat.dto';

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

    async createChat(dto: CreateChatDto): Promise<Chat> {
        return await this.chatsRepository.create({
            tiedTo: dto.tiedTo
        })
    }

    async deleteChat(dto: DeleteChatDto): Promise<number> {
        return await this.chatsRepository.destroy({
            where: {
                id: dto.chatId
            }
        })
    }
}