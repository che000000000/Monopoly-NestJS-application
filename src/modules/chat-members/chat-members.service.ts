import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMember } from 'src/models/chat-members';
import { DeleteChatMemberDto } from './dto/delete-chat-member.dto';

@Injectable()
export class ChatMembersService {
    constructor(@InjectModel(ChatMember) private readonly chatMembersRepository: typeof ChatMember) { }

    async find(member_id: string): Promise<ChatMember | null> {
        return await this.chatMembersRepository.findOne({
            where: {
                id: member_id
            },
            raw: true
        })
    }

    async create(userId: string, chatId: string): Promise<ChatMember> {
        return await this.chatMembersRepository.create({
            userId,
            chatId
        })
    }

    async destroy(dto: DeleteChatMemberDto): Promise<number> {
        return await this.chatMembersRepository.destroy({
            where: {
                userId: dto.userId,
                chatId: dto.chatId
            }
        })
    }
}