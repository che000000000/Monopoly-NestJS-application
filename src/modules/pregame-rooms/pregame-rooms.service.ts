import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { WsExceptionData } from '../gateways/types/ws-exception-data.type';
import { InitRoomDto } from './dto/init-room.dto';
import { TiedTo } from 'src/models/chat.model';
import { FindRoomMembersDto } from './dto/find-room-members.dto';
import { FormatedUser } from './interfaces/formated-user.interface';
import { RemoveFromRoomDto } from './dto/remove-from-room.dto';
import { FormatedRoom } from './interfaces/formated-room.interface';
import { UpdateOwnerIdDto } from './dto/update-owner-id.dto';
import { PregameGateway } from '../gateways/pregame.gateway';
import { ErrorTypes } from '../gateways/constants/error-types';

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

    async findRoomMembers(dto: FindRoomMembersDto): Promise<FormatedUser[]> {
        const [foundRoom, foundMembers] = await Promise.all([
            this.findRoomById(dto.roomId),
            this.usersService.findPregameRoomUsers({
                roomId: dto.roomId
            })
        ])
        if (foundMembers.length === 0) throw new NotFoundException('Room members not found')
        return foundMembers.map(user => ({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl ?? null,
            isOwner: foundRoom?.ownerId === user.id ? true : false,
            role: user.role
        }))
    }

    async updateOwnerId(dto: UpdateOwnerIdDto): Promise<number> {
        const [affectedCount] = await this.pregameRoomsRepository.update(
            { ownerId: dto.newOwnerId },
            { where: { id: dto.roomId } }
        )
        return affectedCount
    }

    async initRoom(dto: InitRoomDto): Promise<FormatedRoom> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if (!foundUser) throw new NotFoundException('User not found.')

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.pregame
        })
        if (!newChat) throw new InternalServerErrorException('Chat not created.')

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

        await this.usersService.updatePregameRoomId({
            userId: foundUser.id,
            roomId: newRoom.id
        })

        return {
            id: newRoom.id,
            createdAt: newRoom.createdAt
        }
    }

    async removeFromRoom(dto: RemoveFromRoomDto): Promise<FormatedUser> {
        const foundRoom = await this.findRoomByUserId(dto.userId)
        if (!foundRoom) throw new BadRequestException(`The user isn't in the room.`)

        const [updatedCount, foundUser] = await Promise.all([
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                roomId: null
            }),
            this.usersService.findUserById(dto.userId)
        ])
        if (updatedCount === 0) throw new InternalServerErrorException('Failed to update pregameRoomId.')
        if (!foundUser) throw new InternalServerErrorException('User not found.')

        const roomMembers = await this.usersService.findPregameRoomUsers({
            roomId: foundRoom.id
        })

        if (roomMembers.length === 0) {
            const deleteChatCount = await this.chatsService.deleteChat({
                chatId: foundRoom.chatId
            })
            if (deleteChatCount === 0) throw new InternalServerErrorException('Failed to delete chat.')
            this.pregameGateway.emitRemoveRoom({
                pregameRoom: foundRoom
            })
        } else {
            const deleteMemberCount = await this.chatMembersService.deleteMember({
                userId: dto.userId,
                chatId: foundRoom.chatId
            })
            if (deleteMemberCount === 0) throw new InternalServerErrorException('Failed to delete chat member.')
            if (foundRoom.ownerId === foundUser.id) {
                await this.updateOwnerId({
                    roomId: foundRoom.id,
                    newOwnerId: roomMembers[0].id
                })
                this.pregameGateway.emitNewOwner({
                    newOwner: roomMembers[0],
                    pregameRoom: foundRoom
                })
            }
        }
        return {
            id: foundUser.id,
            name: foundUser.name,
            avatarUrl: foundUser.avatarUrl ?? null,
            role: foundUser.role
        }
    }
}