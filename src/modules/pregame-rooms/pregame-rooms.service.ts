import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { CreatePregameRoomDto } from './dto/create-pregame-room.dto';
import { DeletePregameRoomDto } from './dto/delete-pregame-room.dto';
import { JoinToRoomDto } from './dto/join-to-roon.dto';
import { LeaveFromRoomDto } from './dto/leave-from-room.dto';
import { KickFromRoomDto } from './dto/kick-from-room.dto';

@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly usersService: UsersService
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

    async createPregameRoom(dto: CreatePregameRoomDto): Promise<void> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if (!foundUser) {
            throw new NotFoundException('User not found.')
        }

        const newPregameRoom = await this.pregameRoomsRepository.create({
            ownerId: dto.userId
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

        const roomMembers = await this.usersService.findPregameRoomUsers(foundRoom.id)

        await Promise.all(
            roomMembers.map(user => {
                this.usersService.updatePregameRoomId({
                    userId: user.id,
                    roomId: null
                })
            })
        )

        await this.pregameRoomsRepository.destroy({
            where: {
                id: foundRoom.id
            }
        })
    }

    async joinToRoom(dto: JoinToRoomDto): Promise<void> {
        const foundUser = await this.usersService.findUserById(dto.userId)
        if(foundUser?.pregameRoomId === dto.roomId) {
            throw new BadRequestException(`You're already in this room.`)
        }

        const foundRoom = await this.findRoomById(dto.roomId)
        if (!foundRoom) {
            throw new NotFoundException('Room not found.')
        }

        await this.usersService.updatePregameRoomId({
            userId: dto.userId,
            roomId: foundRoom.id
        })
    }

    async leaveFromRoom(dto: LeaveFromRoomDto): Promise<void> {
        const foundRoom = await this.findRoomByUserId(dto.userId)
        if(!foundRoom) {
            throw new NotFoundException(`You're not in this room.`)
        }

        await this.usersService.updatePregameRoomId({
            userId: dto.userId,
            roomId: null
        })

        const roomMembers = await this.usersService.findPregameRoomUsers(foundRoom.id)
        console.log(roomMembers)
        if(roomMembers.length === 0) {
            this.pregameRoomsRepository.destroy({where: {
                id: foundRoom.id
            }})
        }
    }

    async kickFromRoom(dto: KickFromRoomDto) {
        const foundRoom = await this.findRoomByUserId(dto.userId)
        console.log(foundRoom)
        if (!foundRoom) {
            throw new NotFoundException('Room not found.')
        }

        if (foundRoom.ownerId !== dto.userId) {
            throw new ForbiddenException(`You're not owner for kicking users.`)
        }

        if (dto.kickedUserId === dto.userId) {
            throw new BadRequestException(`You're can't kick yourself`)
        }

        const foundUser = await this.usersService.findUserById(dto.kickedUserId)
        if (!foundUser) {
            throw new NotFoundException('User not found.')
        }

        await this.usersService.updatePregameRoomId({
            userId: foundUser.id,
            roomId: null
        })
    }
}