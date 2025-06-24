import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { WsExceptionData } from '../gateways/types/ws-exception-data.type';
import { InitRoomDto } from './dto/init-room.dto';
import { ErrorTypes } from '../gateways/filters/WsExcepton.filter';
import { TiedTo } from 'src/models/chat.model';
import { FindRoomMembersDto } from './dto/find-room-members.dto';
import { FormatedUser } from './interfaces/formated-user.interface';

@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
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

    async initRoom(dto: InitRoomDto): Promise<PregameRoom | WsExceptionData> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if(!foundUser) return {
            errorType: ErrorTypes.NotFound,
            message: `User not found.`,
            from: `PregameRoomsService`
        }

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.pregame
        })
        if (!newChat) return {
            errorType: ErrorTypes.Internal,
            message: `Chat wasn't created.`,
            from: `PregameRoomsService`
        }
        
        const [newRoom] = await Promise.all([
            this.pregameRoomsRepository.create({
                ownerId: foundUser.id,
                chatId: newChat.id
            }),
            this.chatMembersService.createMember({
                userId: foundUser.id,
                chatId: newChat.id
            })
        ])

        const updatedCount = await this.usersService.updatePregameRoomId({
            userId: foundUser.id,
            roomId: newRoom.id
        }) 
        if(updatedCount === 0) return {
            errorType: ErrorTypes.Internal,
            message: `User field pregameRoomId wasn't updated.`,
            from: `PregameRoomsService`
        }

        return newRoom
    }

    async findRoomMembers(dto: FindRoomMembersDto): Promise<FormatedUser[] | WsExceptionData> {
        const [foundRoom, foundMembers] = await Promise.all([
            this.findRoomById(dto.roomId),
            this.usersService.findPregameRoomUsers({
                roomId: dto.roomId
            })
        ])
        if (foundMembers.length === 0) return {
            errorType: ErrorTypes.NotFound,
            message: `Pregame room members weren't found.`,
            from: `PregameRoomsService`
        }
        return foundMembers.map(user => ({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl ?? null,
            ifOwner: foundRoom?.ownerId === user.id ? true : false,
            role: user.role
        }))
    }
}