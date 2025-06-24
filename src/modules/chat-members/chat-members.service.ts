import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMember } from 'src/models/chat-members';
import { CreateChatMemberDto } from './dto/create-chat-member.dto';
import { FindChatMembersDto } from './dto/find-chat-members.dto';
import { DeleteChatMemberDto } from './dto/delete-chat-member.dto';
import { FindChatMemberDto } from './dto/find-chat-member.dto';

@Injectable()
export class ChatMembersService {
    constructor(@InjectModel(ChatMember) private readonly chatMembersRepository: typeof ChatMember) { }

    async findChatMemberById(member_id: string): Promise<ChatMember | null> {
        return await this.chatMembersRepository.findOne({
            where: {
                id: member_id
            },
            raw: true
        })
    }

    async findChatMember(dto: FindChatMemberDto): Promise<ChatMember | null> {
        return await this.chatMembersRepository.findOne({
            where: {
                userId: dto.userId,
                chatId: dto.chatId
            },
            raw: true
        })
    }

    async findChatMembers(dto: FindChatMembersDto): Promise<ChatMember[]> {
        return await this.chatMembersRepository.findAll({
            where: {
                chatId: dto.chatId
            },
            raw: true
        })
    }

    async createMember(dto: CreateChatMemberDto): Promise<ChatMember> {
        return await this.chatMembersRepository.create({
            userId: dto.userId,
            chatId: dto.chatId
        })
    }

    async deleteMember(dto: DeleteChatMemberDto): Promise<number> {
        return await this.chatMembersRepository.destroy({
            where: {
                userId: dto.userId,
                chatId: dto.chatId
            }
        })
    }
}