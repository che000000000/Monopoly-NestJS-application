import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from 'src/models/message.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { FindChatMessagesDto } from './dto/find-chat-messages.dto';

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

    async findChatMessages(dto: FindChatMessagesDto): Promise<Message[]> {
        const foundChat = this.chatsService.findChatById(dto.chatId)
        if(!foundChat) throw new BadRequestException(`Chat doesn't exist.`)

        return await this.messagesRepository.findAll({
            where: {
                chatId: dto.chatId
            },
            order: [['createdAt', 'DESC']],
            limit: dto.pageSize
        })
    }

    async createMessage(dto: CreateMessageDto): Promise<Message> {
        const [foundUser, foundChat] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.chatsService.findChatById(dto.chatId)
        ])

        if (!foundUser) {
            throw new NotFoundException(`User not found.`)
        }
        if (!foundChat) {
            throw new NotFoundException(`Chat not found.`)
        }

        const foundChatMember = await this.chatMembersService.findChatMember({
            userId: foundUser.id,
            chatId: foundChat.id
        })
        if (!foundChatMember) {
            throw new BadRequestException(`User isn't a member of the chat.`)
        }
        return await this.messagesRepository.create({
            userId: foundUser.id,
            chatId: foundChat.id,
            text: dto.messageText
        })
    }
}