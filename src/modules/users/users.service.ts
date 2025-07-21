import { BadRequestException, ConflictException, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { User, UserRole } from 'src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { UpdatePregameRoomIdDto } from './dto/update-pregame-room.dto';
import { UpdateGameIdDto } from './dto/update-game-id.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User) private readonly usersRepository: typeof User) { }

    async find(userId: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { id: userId },
            raw: true
        })
    }

    async getOrThrow(userId: string): Promise<User> {
        const foundUser = await this.find(userId)
        if(!foundUser) throw new BadRequestException(`User doesn't exist.`)
        return foundUser
    }

    async findByEmail(userEmail: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { email: userEmail },
            raw: true
        })
    }

    async findPregameRoomUsers(pregameRoomId: string): Promise<User[]> {
        return await this.usersRepository.findAll({
            where: { pregameRoomId },
            raw: true
        })
    }

    async updatePregameRoomId(userId: string, pregameRoomId: string | null): Promise<number> {
        const [affectedCount] = await this.usersRepository.update(
            { pregameRoomId },
            { where: { id: userId } }
        )
        return affectedCount
    }

    async updateGameId(dto: UpdateGameIdDto): Promise<number> {
        const [affectedCount] = await this.usersRepository.update(
            { gameId: dto.gameId },
            { where: { id: dto.userId } }
        )
        return affectedCount
    }

    async getUserProfile(userId: string) {
        const foundUser = await this.find(userId)
        if (!foundUser) throw new BadRequestException('User not found.')
        return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            avatarUrl: foundUser.avatarUrl,
            role: foundUser.role,
            isVerified: foundUser.isVerified,
        }
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const emailExists = await this.usersRepository.findOne({
            where: { email: dto.email }
        })

        if (emailExists) {
            throw new BadRequestException('Email already using.')
        }

        return await this.usersRepository.create({
            email: dto.email,
            name: dto.name,
            password: dto.password ? await bcrypt.hash(dto.password, 10) : null,
            avatarUrl: dto.avatarUrl,
            role: UserRole.REGULAR,
            authMethod: dto.authMethod
        })
    }
}