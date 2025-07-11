import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { TiedTo } from 'src/models/chat.model';
import { MessagesService } from '../messages/messages.service';
import { User } from 'src/models/user.model';
import { Message } from 'src/models/message.model';
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

    async getPregameRoomsCount(): Promise<number> {
        return await this.pregameRoomsRepository.count()
    }

    async getPregameRoomsPage(pageNumber: number | undefined | null, pageSize: number | undefined | null): Promise<{page: PregameRoom[], totalCount: number}> {
        const options = {
            pageNumber: pageNumber ? pageNumber : 1,
            pageSize: pageSize ? pageSize : 10
        }

        return {
            page: await this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: options.pageSize,
                offset: (options.pageNumber - 1) * options.pageSize,
                raw: true
            }),
            totalCount: await this.getPregameRoomsCount()
        }
    }

    async getPregameRoomMessagesPage(pregameRoom: PregameRoom, pageNumber: number | undefined | null, pageSize: number | undefined | null): Promise<{page: Message[], totalCount: number}> {
        const options = {
            pageNumber: pageNumber ? pageNumber : 1,
            pageSize: pageSize ? pageSize : 10
        }

        const [messagesPage, totalCount] = await Promise.all([
            this.messagesService.getChatMessagesPage(pregameRoom.chatId, options.pageNumber, options.pageSize),
            this.messagesService.getChatMessagesCount(pregameRoom.chatId)
        ])

        return {
            page: messagesPage,
            totalCount
        }
    }

    async initPregameRoom(userId: string): Promise<PregameRoom> {
        const newPregameRoomChat = await this.chatsService.createChat(TiedTo.PREGAME)

        const [newPregameRoom, PregameRoomChatMembers] = await Promise.all([
            this.create(userId, newPregameRoomChat.id),
            this.chatMembersService.create(userId, newPregameRoomChat.id)
        ])

        await this.usersService.updatePregameRoomId(userId, newPregameRoom.id)

        return newPregameRoom
    }

    async removeRoom(pregameRoom: PregameRoom): Promise<number> {
        return await this.chatsService.deleteChat(pregameRoom.chatId)
    }

    async removeUserFromRoom(user: User, pregameRoom: PregameRoom): Promise<{destroyChatMemberCount: number, affectedPregameRoomIdCount: number}> {
        const [destroyChatMemberCount, affectedPregameRoomIdCount] = await Promise.all([
            this.chatMembersService.destroy(pregameRoom.chatId, user.id),
            this.usersService.updatePregameRoomId(user.id, null)
        ])

        return {
            destroyChatMemberCount,
            affectedPregameRoomIdCount
        }
    }

    async chooseNewOwner(pregameRoom: PregameRoom): Promise<User> {
        const pregameRoomMembers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
        const randomIndex = Math.floor(Math.random() * pregameRoomMembers.length)

        const newOwner = await this.usersService.find(pregameRoomMembers[randomIndex].id)
        if (!newOwner) throw new InternalServerErrorException(`Failed to choose new pregame room owner. New pregame room owner not found.`)

        await this.updateOwnerId(newOwner.id, pregameRoom.id)
        return newOwner
    }

    async joinUserToRoom(user: User, pregameRoom: PregameRoom): Promise<void> {
        await Promise.all([
            this.chatMembersService.create(user.id, pregameRoom.chatId),
            this.usersService.updatePregameRoomId(user.id, pregameRoom.id)
        ])
    }

    async sendMessage(user: User, pregameRoom: PregameRoom, messageText: string): Promise<Message> {
        return await this.messagesService.createMessage(user.id, pregameRoom.chatId, messageText)
    }
}