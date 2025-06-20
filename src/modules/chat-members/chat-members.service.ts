import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMember } from 'src/models/chat-members';
import { UsersService } from '../users/users.service';
import { CreateChatMemberDto } from './dto/create-chat-member.dto';
import { ChatsService } from '../chats/chats.service';
import { FindChatMembersDto } from './dto/find-chat-members.dto';
import { DeleteChatMemberDto } from './dto/delete-chat-member.dto';
import { FindChatMemberDto } from './dto/find-chat-member.dto';

@Injectable()
export class ChatMembersService {
    constructor(
        @InjectModel(ChatMember) private readonly chatMembersRepository: typeof ChatMember,
        @Inject(forwardRef(() => ChatsService)) private readonly chatsService: ChatsService,
        private readonly usersService: UsersService,
    ) { }

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
            }
        })
    }

    async createMember(dto: CreateChatMemberDto): Promise<ChatMember> {
        const [foundUser, foundChat] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.chatsService.findChatById(dto.chatId)
        ])

        if(!foundUser) {
            throw new NotFoundException(`User doesn't exist.`)
        }
        if(!foundChat) {
            throw new NotFoundException(`Chat doesn't exist`)
        }

        return await this.chatMembersRepository.create({
            userId: foundUser.id,
            chatId: foundChat.id
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