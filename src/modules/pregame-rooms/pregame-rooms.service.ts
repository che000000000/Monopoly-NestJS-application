import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { InitRoomDto } from './dto/init-room.dto';
import { TiedTo } from 'src/models/chat.model';
import { FindRoomMembersDto } from './dto/find-room-members.dto';
import { FormatedUser } from './interfaces/formated-user.interface';
import { FormatedRoom } from './interfaces/formated-room.interface';
import { UpdateOwnerIdDto } from './dto/update-owner-id.dto';
import { RemoveRoomDto } from './dto/remove-room.dto';
import { AppointNewOwnerDto } from './dto/appiont-new-owner.dto';
import { RemoveUserFromRoomDto } from './dto/remove-user-from-room.dto';
import { JoinUserToRoom } from './dto/join-user-to-room.dto';

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

    async updateOwnerId(dto: UpdateOwnerIdDto): Promise<number> {
        const [affectedCount] = await this.pregameRoomsRepository.update(
            { ownerId: dto.newOwnerId },
            { where: { id: dto.roomId } }
        )
        return affectedCount
    }

    async findRoomMembers(dto: FindRoomMembersDto): Promise<FormatedUser[]> {
        const [foundRoom, foundMembers] = await Promise.all([
            this.findRoomById(dto.roomId),
            this.usersService.findPregameRoomUsers({
                roomId: dto.roomId
            })
        ])
        if (foundMembers.length === 0) throw new NotFoundException(`Room members not found`)
        return foundMembers.map(user => ({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl ?? null,
            isOwner: foundRoom?.ownerId === user.id ? true : false,
            role: user.role
        }))
    }

    async initRoom(dto: InitRoomDto): Promise<FormatedRoom> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if (!foundUser) throw new NotFoundException(`User not found.`)

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.pregame
        })
        if (!newChat) throw new InternalServerErrorException(`Chat not created.`)

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
            newRoomId: newRoom.id
        })

        return {
            id: newRoom.id,
            createdAt: newRoom.createdAt
        }
    }

    async removeUserFromRoom(dto: RemoveUserFromRoomDto): Promise<FormatedUser> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.findRoomByUserId(dto.userId),
        ])
        if (!foundUser) throw new InternalServerErrorException(`User not found.`)
        if (!foundRoom) throw new InternalServerErrorException(`User isn't in the pregameRoom.`)

        await Promise.all([
            this.chatMembersService.deleteMember({
                userId: dto.userId,
                chatId: foundRoom?.chatId
            }),
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                newRoomId: null
            })
        ])

        return {
            id: foundUser.id,
            name: foundUser.name,
            avatarUrl: foundUser.avatarUrl ?? null,
            role: foundUser.role
        }
    }

    async removeRoom(dto: RemoveRoomDto): Promise<FormatedRoom> {
        const foundRoom = await this.findRoomById(dto.roomId)
        if (!foundRoom) throw new InternalServerErrorException(`Room not found.`)

        await this.chatsService.deleteChat({
            chatId: foundRoom.chatId
        })

        return {
            id: foundRoom.id,
            createdAt: foundRoom.createdAt
        }
    }

    async appointNewOwner(dto: AppointNewOwnerDto): Promise<FormatedUser> {
        const [foundRoom, roomMembers] = await Promise.all([
            this.findRoomById(dto.roomId),
            this.usersService.findPregameRoomUsers({
                roomId: dto.roomId
            })
        ])
        if (!foundRoom) throw new InternalServerErrorException(`Room not found.`)
        if (roomMembers.length === 0) throw new InternalServerErrorException(`Room is empty. Can't appoint new owner.`)

        const randomIndex = Math.floor(Math.random() * roomMembers.length)
        const newOwner = roomMembers[randomIndex]

        await this.updateOwnerId({
            roomId: foundRoom.id,
            newOwnerId: newOwner.id
        })

        return {
            id: newOwner.id,
            name: newOwner.name,
            avatarUrl: newOwner.avatarUrl,
            role: newOwner.role
        }
    }

    async joinUserToRoom(dto: JoinUserToRoom): Promise<{ joinedUser: FormatedUser, pregameRoom: FormatedRoom }> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.findRoomById(dto.roomId)
        ])
        if (!foundUser) throw new InternalServerErrorException(`User not found.`)
        if (foundUser.pregameRoomId) throw new BadRequestException(`User is already in the room.`)
        if (!foundRoom) throw new BadRequestException(`Room doesn't exist.`)

        await Promise.all([
            this.chatMembersService.createMember({
                userId: foundUser.id,
                chatId: foundRoom.chatId
            }),
            this.usersService.updatePregameRoomId({
                userId: foundUser.id,
                newRoomId: foundRoom.id
            })
        ])

        return {
            joinedUser: {
                id: foundUser.id,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl ?? null,
                role: foundUser.role
            },
            pregameRoom: {
                id: foundRoom.id,
                createdAt: foundRoom.createdAt
            }
        }
    }
}