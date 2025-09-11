import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat, ChatType } from './model/chat';

@Injectable()
export class ChatsService {
    constructor(@InjectModel(Chat) private readonly chatsRepository: typeof Chat) { }

    async findOne(id: string): Promise<Chat | null> {
        return await this.chatsRepository.findOne({
            where: { id },
        })
    }

    async findOneWhereChatTypeGlobal(): Promise<Chat | null> {
        return await this.chatsRepository.findOne({
            where: { type: ChatType.GLOBAL}
        })
    }

    async getOneOrThrow(id: string): Promise<Chat> {
        const foundChat = await this.findOne(id)
        if (!foundChat) throw new NotFoundException('Failed to get chat. Chat not found.')
        return foundChat
    }

    async create(type: ChatType): Promise<Chat> {
        return await this.chatsRepository.create({
            type
        })
    }

    async destroy(id: string): Promise<number> {
        return await this.chatsRepository.destroy({
            where: { id }
        })
    }

    async updateType(id: string, type: ChatType): Promise<number> {
        const [affectedCount] = await this.chatsRepository.update(
            { type },
            { where: { id } }
        )
        return affectedCount
    }
}