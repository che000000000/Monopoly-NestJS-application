import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { CreatePregameRoomDto } from './dto/create-pregame-room.dto';
import { ChatsService } from '../chats/chats.service';
import { TiedTo } from 'src/models/chat.model';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { PregameGateway } from '../gateways/pregame.gateway';
import { GetRoomsPageDto } from './dto/get-rooms-page.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { KickFromRoomDto } from './dto/kick-from-room.dto';

@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        @Inject(forwardRef(() => PregameGateway)) private readonly pregameGateway: PregameGateway,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService
    ) { }

    async findRoomById(room_id: string): Promise<PregameRoom | null> {
        return await this.pregameRoomsRepository.findOne({
            where: { id: room_id },
            raw: true
        })
    }

    async findRoomByUserId(user_id: string): Promise<PregameRoom | null> {
        const foundUser = await this.usersService.findUserById(user_id)
        if (!foundUser) return null  

        return await this.pregameRoomsRepository.findOne({
            where: {
                id: foundUser.pregameRoomId
            },
            raw: true
        })
    }

    async getRoomsPage(dto: GetRoomsPageDto): Promise<{ roomsPage: PregameRoom[], totalCount: number }> {
        const [roomsPage, totalCount] = await Promise.all([
            this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: dto.pageSize ? dto.pageSize : 12,
                offset: (dto.pageNumber - 1) * dto.pageSize
            }),
            this.pregameRoomsRepository.count()
        ])

        return { roomsPage, totalCount }
    }

    async createRoom(dto: CreatePregameRoomDto): Promise<PregameRoom | null> {
        const newChat = await this.chatsService.createChat({
            usersIds: [dto.userId],
            tiedTo: TiedTo.pregame
        })
        if (!newChat) return null

        const newRoom = await this.pregameRoomsRepository.create({
            ownerId: dto.userId,
            chatId: newChat.id
        })
        if (!newRoom) return null

        await this.usersService.updatePregameRoomId({
            userId: dto.userId,
            roomId: newRoom.id
        })

        return newRoom
    }

    async joinRoom(dto: JoinRoomDto): Promise<PregameRoom | null> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.pregameRoomsRepository.findOne({
                where: { id: dto.roomId }
            })
        ])
        if (!foundUser || !foundRoom) return null
        
        await Promise.all([
            this.chatMembersService.createMember({
                userId: foundUser.id,
                chatId: foundRoom.chatId
            }),
            this.usersService.updatePregameRoomId({
                userId: foundUser.id,
                roomId: foundRoom.id
            })
        ])

        return foundRoom
    }

    async leaveRoom(dto: LeaveRoomDto): Promise<boolean> {
        const foundRoom = await this.findRoomById(dto.roomId)
        if (!foundRoom) return false

        await Promise.all([
            this.chatMembersService.deleteMember({
                userId: dto.userId,
                chatId: foundRoom.chatId
            }),
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                roomId: null
            }),
        ])
        const roomUsers = await this.usersService.findPregameRoomUsers({ roomId: foundRoom.id })

        if(roomUsers.length === 0) {
            await this.chatsService.deleteChat({ chatId: foundRoom.chatId })
        }

        return true
    }

    async kickFromRoom(dto: KickFromRoomDto): Promise<boolean> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.findRoomById(dto.roomId)
        ])
        if (!foundUser || !foundRoom) return false


        await Promise.all([
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                roomId: null
            }),
            this.chatMembersService.deleteMember({
                chatId: foundRoom.chatId,
                userId: dto.userId
            }),
            
        ])
        const roomUsers = await this.usersService.findPregameRoomUsers({ roomId: foundRoom.id })

        if(roomUsers.length === 0) {
            await this.chatsService.deleteChat({ chatId: foundRoom.chatId })
        }

        return true
    }
}