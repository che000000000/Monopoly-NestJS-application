import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat } from 'src/models/chat.model';
import { CreateChatDto } from './dto/create-chat.dto';
import { DeleteChatDto } from './dto/delete-chat.dto';
import { ChatMembersService } from '../chat-members/chat-members.service';

@Injectable()
export class ChatsService {
    constructor(
        @InjectModel(Chat) private readonly chatsRepository: typeof Chat,
        @Inject(forwardRef(()=> ChatMembersService)) private readonly chatMembersService: ChatMembersService
    ) { }

    async findChatById(chat_id: string): Promise<Chat | null> {
        return await this.chatsRepository.findOne({
            where: {
                id: chat_id
            }
        })
    }

    async createChat(dto: CreateChatDto): Promise<Chat> {
        const newChat = await this.chatsRepository.create({
            tiedTo: dto.tiedTo
        })
        
        await this.chatMembersService.createMember({
            chatId: newChat.id,
            userId: dto.userId
        })

        return newChat
    }

    async deleteChat(dto: DeleteChatDto): Promise<number> {
        return await this.chatsRepository.destroy({
            where: {
                id: dto.chatId
            }
        })
    }
}