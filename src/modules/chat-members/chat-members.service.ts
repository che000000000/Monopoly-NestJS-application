import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMember } from 'src/modules/chat-members/model/chat-member';

@Injectable()
export class ChatMembersService {
    constructor(@InjectModel(ChatMember) private readonly chatMembersRepository: typeof ChatMember) { }

    async findOne(id: string): Promise<ChatMember | null> {
        return await this.chatMembersRepository.findOne({
            where: { id }
        })
    }

    async findOneByChatIdAndUserId(chatId: string, userId: string): Promise<ChatMember | null> {
        return await this.chatMembersRepository.findOne({
            where: { chatId, userId }
        })
    }

    async create(userId: string, chatId: string): Promise<ChatMember> {
        return await this.chatMembersRepository.create({ userId, chatId })
    }

    async destroy(chatId: string, userId: string): Promise<number> {
        return await this.chatMembersRepository.destroy({
            where: { userId, chatId }
        })
    }
}