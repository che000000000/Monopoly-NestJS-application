import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { CreatePregameRoomDto } from './dto/create-pregame-room.dto';
import { ChatsService } from '../chats/chats.service';
import { TiedTo } from 'src/models/chat.model';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { PregameGateway } from '../gateways/pregame-gateway/pregame.gateway';
import { GetRoomsPageDto } from './dto/get-rooms-page.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { KickFromRoomDto } from './dto/kick-from-room.dto';
import { ExceptionData } from '../gateways/types/exception-data.type';
import { ErrorTypes } from '../gateways/filters/WsExcepton.filter';
import { SetOwnerIdDto } from './dto/set-owner-id.dto';

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

    async setOwnerId(dto: SetOwnerIdDto): Promise<void> {
        await this.pregameRoomsRepository.update(
            { ownerId: dto.userId },
            { where: { id: dto.roomId } }
        )
    }

    async getRoomsPage(dto: GetRoomsPageDto): Promise<{ roomsPage: PregameRoom[], totalCount: number }> {
        const [roomsPage, totalCount] = await Promise.all([
            this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: dto.pageSize ? dto.pageSize : 12,
                offset: (dto.pageNumber - 1) * dto.pageSize,
                raw: true
            }),
            this.pregameRoomsRepository.count()
        ])

        return { roomsPage, totalCount }
    }

    async createRoom(dto: CreatePregameRoomDto): Promise<PregameRoom | ExceptionData> {
        const newChat = await this.chatsService.createChat({
            usersIds: [dto.userId],
            tiedTo: TiedTo.pregame
        })
        if (!newChat) {
            return {
                errorType: ErrorTypes.Internal,
                message: `Room's chat wasn't created.`
            }
        }

        const newRoom = await this.pregameRoomsRepository.create({
            ownerId: dto.userId,
            chatId: newChat.id
        })
           if (!newRoom) {
            return {
                errorType: ErrorTypes.Internal,
                message: `Room wasn't created.`
            }
        }

        await this.usersService.updatePregameRoomId({
            userId: dto.userId,
            roomId: newRoom.id
        })

        return newRoom
    }

    async joinRoom(dto: JoinRoomDto): Promise<PregameRoom | ExceptionData> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.pregameRoomsRepository.findOne({
                where: { id: dto.roomId }
            })
        ])
        if (!foundUser) {
            return ({
                errorType: ErrorTypes.Internal,
                message: `User not created.`
            })
        }
        if(!foundRoom) {
            return ({
                errorType: ErrorTypes.Internal,
                message: `Room not found.`
            })
        }

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

    async leaveRoom(dto: LeaveRoomDto): Promise<boolean | ExceptionData> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.findRoomById(dto.roomId)
        ])
        if (!foundUser) {
            return {
                errorType: ErrorTypes.NotFound,
                message: 'User not found.'
            }
        }
        if (!foundRoom) {
            return {
                errorType: ErrorTypes.NotFound,
                message: 'Room not found.'
            }
        }
        if (foundUser.pregameRoomId !== foundRoom.id) {
            return {
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in the room.`
            }
        }

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

        const roomMembers = await this.usersService.findPregameRoomUsers({
            roomId: foundRoom.id
        })

        if (roomMembers.length === 0) {
            await Promise.all([
                this.chatsService.deleteChat({
                    chatId: foundRoom.chatId
                }),
                this.pregameGateway.reportRoomRemoved({
                    roomId: foundRoom.id
                })
            ])
        } else if ((foundRoom.ownerId === foundUser.id)) {
            await this.setOwnerId({
                userId: roomMembers[0].id,
                roomId: foundRoom.id
            })
            await this.pregameGateway.emitNewRoomOwner({
                roomId: foundRoom.id
            })
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

        if (roomUsers.length === 0) {
            await this.chatsService.deleteChat({ chatId: foundRoom.chatId })
        }

        return true
    }
}