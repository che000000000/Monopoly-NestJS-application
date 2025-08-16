import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { MessagesService } from '../messages/messages.service';
import { PregameRoomMembersService } from '../pregame-room-members/pregame-room-members.service';
import { Chat, TiedTo } from 'src/models/chat.model';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { ChatMember } from 'src/models/chat-members';
@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService,
        private readonly messagesService: MessagesService
    ) { }

    async findOne(id: string): Promise<PregameRoom | null> {
        return await this.pregameRoomsRepository.findOne({
            where: { id },
            raw: true
        })
    }

    async getOneOrThrow(roomId: string): Promise<PregameRoom> {
        const foundRoom = await this.findOne(roomId)
        if (!foundRoom) throw new NotFoundException(`Room doesn't exist.`)
        return foundRoom
    }

    async create(): Promise<PregameRoom> {
        try {
            return await this.pregameRoomsRepository.create()
        } catch (error) {
            console.error(`Sequelize error: ${error}`)
            throw new InternalServerErrorException('Failed to create pregame room.')
        }
    }

    async destroy(id: string): Promise<number> {
        return await this.pregameRoomsRepository.destroy({
            where: { id }
        })
    }

    async updateOwnerId(ownerId: string, id: string): Promise<number> {
        const [affectedCount] = await this.pregameRoomsRepository.update(
            { ownerId },
            { where: { id } }
        )
        return affectedCount
    }

    async getPregameRoomsCount(): Promise<number> {
        return await this.pregameRoomsRepository.count()
    }

    async getPregameRoomsPage(pageNumber: number, pageSize: number): Promise<{ page: PregameRoom[], totalCount: number }> {
        return {
            page: await this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset: (pageNumber - 1) * pageSize,
                raw: true
            }),
            totalCount: await this.getPregameRoomsCount()
        }
    }

    async init(userId: string): Promise<{pregameRoom: PregameRoom, pregameRoomMember: PregameRoomMember, chat: Chat, chatMember: ChatMember}> {
        const user = await this.usersService.findOne(userId)
        if (!user) throw new NotFoundException('Failed to init pregame room. User not found.')

        const newPregameRoom = await this.create()

        const [newChat, newPregameRoomMember] = await Promise.all([
            this.chatsService.create(TiedTo.PREGAME),
            this.pregameRoomMembersService.create(newPregameRoom.id, user.id, true, 1)
        ])

        const newChatMember = await this.chatMembersService.create(user.id, newChat.id)

        return {
            pregameRoom: newPregameRoom,
            pregameRoomMember: newPregameRoomMember,
            chat: newChat,
            chatMember: newChatMember
        }
    }
}