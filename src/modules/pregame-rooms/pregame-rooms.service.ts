import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { CreatePregameRoomDto } from './dto/create-pregame-room.dto';
import { DeletePregameRoomDto } from './dto/delete-pregame-room.dto';
import { JoinToRoomDto } from './dto/join-to-roon.dto';
import { LeaveFromRoomDto } from './dto/leave-from-room.dto';

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
        if (!foundUser) {
            throw new NotFoundException('User not found')
        }

        const foundRoom = await this.pregameRoomsRepository.findOne({
            where: {
                id: foundUser.pregameRoomId
            },
            raw: true
        })

        return foundRoom
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
        if(!foundRoom) {
            throw new NotFoundException('Room not found.')
        }

        if(dto.userId !== foundRoom.ownerId) {
            throw new NotFoundException(`You're not owner of this room.`)
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

        await this.pregameRoomsRepository.destroy({where: {
            id: foundRoom.id
        }})
    }

    async joinToRoom(dto: JoinToRoomDto): Promise<void> {
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
        await this.usersService.updatePregameRoomId({
            userId: dto.userId,
            roomId: null
        })
    }
}