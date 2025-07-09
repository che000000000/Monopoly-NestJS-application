import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { TiedTo } from 'src/models/chat.model';
import { MessagesService } from '../messages/messages.service';
import { User } from 'src/models/user.model';
@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService,
        private readonly messagesService: MessagesService
    ) { }

    async find(roomId: string): Promise<PregameRoom | null> {
        return await this.pregameRoomsRepository.findOne({
            where: { id: roomId },
            raw: true
        })
    }

    async findByUser(userId: string): Promise<PregameRoom | null> {
        const foundUser = await this.usersService.find(userId)
        if (!foundUser) return null

        return await this.pregameRoomsRepository.findOne({
            where: { id: foundUser.pregameRoomId },
            raw: true
        })
    }

    async getOrThrow(roomId: string): Promise<PregameRoom> {
        const foundRoom = await this.find(roomId)
        if (!foundRoom) throw new NotFoundException(`Room doesn't exist.`)
        return foundRoom
    }

    async getByUserOrThrow(userId: string): Promise<PregameRoom> {
        const foundRoom = await this.findByUser(userId)
        if (!foundRoom) throw new NotFoundException(`Room doesn't exist.`)
        return foundRoom
    }

    async create(ownerId: string, chatId: string): Promise<PregameRoom> {
        return await this.pregameRoomsRepository.create({
            ownerId,
            chatId
        })
    }

    async updateOwnerId(newOwnerId: string, pregameRoomId: string): Promise<number> {
        const [affectedCount] = await this.pregameRoomsRepository.update(
            { ownerId: newOwnerId },
            { where: { id: pregameRoomId } }
        )
        return affectedCount
    }

    async getRooms(pageNumber: number, pageSize: number): Promise<PregameRoom[]> {
        return await this.pregameRoomsRepository.findAll({
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
            raw: true
        })
    }

    async getRoomMembers(roomId: string): Promise<User[]> {
        return await this.usersService.findPregameRoomUsers(roomId)
    }

    // async formatPregameRoomMember(pregameRoom: PregameRoom, user: User): Promise<PregameRoomMember> {
        
    // }

    // async getRoomsPage(dto: GetRoomsPageDto): Promise<{ page: PregameRoomsWithMembers[], totalCount: number }> {
        
    // }

    // async formatPregameRoomMessages(pregameRoom: PregameRoom, messages: Message[]): Promise<PregameRoomWithMessages> {
        
    // }

    // async getRoomMessagesPage(dto: GetRoomMessagesPageDto): Promise<{ page: PregameRoomWithMessages, totalCount: number }> {
        
    // }

    async initPregameRoom(userId: string): Promise<PregameRoom> {
        const newPregameRoomChat = await this.chatsService.createChat(TiedTo.PREGAME)

        const [newPregameRoom, PregameRoomChatMembers] = await Promise.all([
            this.create(userId, newPregameRoomChat.id),
            this.chatMembersService.create(userId, newPregameRoomChat.id)
        ])

        await this.usersService.updatePregameRoomId(userId, newPregameRoom.id)

        return newPregameRoom
    }

    // async removeUserFromRoom(userId: string): Promise<{user: PregameRoomMember, room: CommonPregameRoom}> {
        
    // }

    // async removeRoom(dto: RemoveRoomDto): Promise<CommonPregameRoom> {
        
    // }

    // async chooseNewOwner(dto: AppointNewOwnerDto): Promise<User> {
        
    // }

    async joinUserToRoom(user: User, pregameRoom: PregameRoom): Promise<void> {
        await Promise.all([
            this.chatMembersService.create(user.id, pregameRoom.chatId),
            this.usersService.updatePregameRoomId(user.id, pregameRoom.id)
        ])
    }

    // async kickUserFromRoom(dto: KickUserFromRoomDto): Promise<{ kickedUser: PregameRoomMember, fromRoom: CommonPregameRoom }> {
        
    // }

    // async sendMessage(dto: SendMessageDto): Promise<{ message: PregameRoomMessage, room: CommonPregameRoom }> {

    // }
}