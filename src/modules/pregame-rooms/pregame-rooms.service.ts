import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { CreatePregameRoomDto } from './dto/create-pregame-room.dto';
import { DeletePregameRoomDto } from './dto/delete-pregame-room.dto';
import { JoinToRoomDto } from './dto/join-to-roon.dto';
import { LeaveFromRoomDto } from './dto/leave-from-room.dto';
import { KickFromRoomDto } from './dto/kick-from-room.dto';
import { ChatsService } from '../chats/chats.service';
import { TiedTo } from 'src/models/chat.model';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { PregameChatsGateway } from '../gateways/pregame-chats.gateway';

@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService,
        @Inject(forwardRef(() => PregameChatsGateway)) private readonly pregameChatsGateway: PregameChatsGateway
    ) { }

    async findRoomById(room_id: string): Promise<PregameRoom | null> {
        return await this.pregameRoomsRepository.findOne({
            where: {
                id: room_id
            }
        })
    }

    async findRoomByUserId(user_id: string): Promise<PregameRoom | null> {
        const foundUser = await this.usersService.findUserById(user_id)

        return await this.pregameRoomsRepository.findOne({
            where: {
                id: foundUser?.pregameRoomId
            },
            raw: true
        })
    }

    async getRoomChatId(room_id: string) {
        return await this.pregameRoomsRepository.findOne({
            where: { id: room_id },
            attributes: ['chatId']
        })
    }

    async createPregameRoom(dto: CreatePregameRoomDto): Promise<void> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if (!foundUser) {
            throw new NotFoundException('User not found.')
        }
        if (foundUser.pregameRoomId) {
            throw new BadRequestException(`User in other room already.`)
        }

        const newChat = await this.chatsService.createChat({
            tiedTo: TiedTo.pregame,
            usersIds: [foundUser.id]
        })
        if (!newChat) {
            throw new InternalServerErrorException('Chat not created.')
        }

        const newPregameRoom = await this.pregameRoomsRepository.create({
            ownerId: dto.userId,
            chatId: newChat.id
        })

        await this.usersService.updatePregameRoomId({
            userId: foundUser.id,
            roomId: newPregameRoom.id
        })
    }

    async deletePregameRoom(dto: DeletePregameRoomDto): Promise<void> {
        const foundRoom = await this.findRoomByUserId(dto.userId)
        if (!foundRoom) {
            throw new NotFoundException('Room not found.')
        }

        if (dto.userId !== foundRoom.ownerId) {
            throw new ForbiddenException(`You're not owner of this room.`)
        }

        await Promise.all([
            this.pregameChatsGateway.disconnectSocketsFromRoom({ chatId: foundRoom.chatId }),
            this.chatsService.deleteChat({ chatId: foundRoom.chatId }),
            this.pregameRoomsRepository.destroy({
                where: {
                    id: foundRoom.id
                }
            })
        ])
    }

    async joinToRoom(dto: JoinToRoomDto): Promise<void> {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.userId),
            this.findRoomById(dto.roomId),
        ])

        if (!foundUser) {
            throw new BadRequestException(`User not found.`)
        }
        if (!foundRoom) {
            throw new NotFoundException('Room not found.')
        }
        if (foundUser.pregameRoomId) {
            throw new BadRequestException(`User in the room already.`)
        }

        const [affectedCount, newChatMember] = await Promise.all([
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                roomId: foundRoom.id
            }),

            this.chatMembersService.createMember({
                userId: foundUser.id,
                chatId: foundRoom.chatId
            }),
        ])

        if (affectedCount === 0) {
            throw new InternalServerErrorException(`User pregameRoomId field wasn't updated.`)
        }
        if (!newChatMember) {
            throw new InternalServerErrorException(`New chat member wasn't created.`)
        }
    }

    async leaveFromRoom(dto: LeaveFromRoomDto): Promise<void> {
        const foundRoom = await this.findRoomByUserId(dto.userId)
        if (!foundRoom) {
            throw new NotFoundException(`User not in the room.`)
        }

        await this.pregameChatsGateway.disconnectSocket({
            userId: dto.userId,
            chatId: foundRoom.chatId
        })

        const [affectedCount, deleteMemberResult] = await Promise.all([
            this.usersService.updatePregameRoomId({
                userId: dto.userId,
                roomId: null
            }),
            this.chatMembersService.deleteMember({
                userId: dto.userId,
                chatId: foundRoom.chatId
            })
        ])

        if (affectedCount === 0) {
            throw new InternalServerErrorException(`User pregameRoomId field wasn't updated.`)
        }
        if (deleteMemberResult === 0) {
            throw new InternalServerErrorException(`Member wasn't deleted.`)
        }

        const roomMembers = await this.usersService.findPregameRoomUsers(foundRoom.id)
        if (roomMembers === null) {
            throw new NotFoundException('Room is clear.')
        }

        if (roomMembers.length === 0) {
            await Promise.all([
                this.pregameChatsGateway.disconnectSocketsFromRoom({ chatId: foundRoom.chatId }),
                this.chatsService.deleteChat({ chatId: foundRoom.chatId }),
                this.pregameRoomsRepository.destroy({
                    where: {
                        id: foundRoom.id
                    }
                })
            ])
        }
    }

    async kickFromRoom(dto: KickFromRoomDto) {
        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(dto.kickedUserId),
            this.findRoomByUserId(dto.userId)
        ])

        if (!foundUser) {
            throw new NotFoundException('User not found.')
        }
        if (!foundRoom) {
            throw new NotFoundException('Room not found.')
        }

        if(foundUser.pregameRoomId !== foundRoom.id) {
            throw new BadRequestException(`User not in the room.`)
        }
        if (foundRoom.ownerId !== dto.userId) {
            throw new ForbiddenException(`You're not owner for kicking users.`)
        }
        if (dto.kickedUserId === dto.userId) {
            throw new BadRequestException(`You're can't kick yourself`)
        }

        await Promise.all([
            this.pregameChatsGateway.disconnectSocket({
                userId: foundUser.id,
                chatId: foundRoom.chatId
            }),
            this.chatMembersService.deleteMember({
                chatId: foundRoom.chatId,
                userId: foundUser.id
            }),
            this.usersService.updatePregameRoomId({
                userId: foundUser.id,
                roomId: null
            })
        ])
    }
}