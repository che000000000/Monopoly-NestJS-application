import { BadRequestException, ConflictException, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { User, UserRole } from 'src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { UpdatePregameRoomIdDto } from './dto/update-pregame-room.dto';
import { UpdateGameIdDto } from './dto/update-game-id.dto';
import { FindPregameRoomUsersDto } from './dto/find-pregame-users.dto';
import { FindGameUsersDto } from './dto/find-game-users.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User) private readonly usersRepository: typeof User) { }

    async findUserById(user_id: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { id: user_id },
            raw: true
        })
    }

    async getUser(user_id: string): Promise<User> {
        const foundUser = await this.findUserById(user_id)
        if(!foundUser) throw new BadRequestException(`User doesn't exist.`)
        return foundUser
    }

    async findUserByEmail(user_email: string): Promise<User | null> {
        return await this.usersRepository.findOne({
            where: { email: user_email },
            raw: true
        })
    }

    async findPregameRoomUsers(dto: FindPregameRoomUsersDto): Promise<User[]> {
        return await this.usersRepository.findAll({
            where: { pregameRoomId: dto.roomId, },
            raw: true
        })
    }

    async findGameUsers(dto: FindGameUsersDto): Promise<User[]> {
        return await this.usersRepository.findAll({
            where: { gameId: dto.gameId, },
            raw: true
        })
    }

    async updatePregameRoomId(dto: UpdatePregameRoomIdDto): Promise<number> {
        const [affectedCount] = await this.usersRepository.update(
            { pregameRoomId: dto.newRoomId },
            { where: { id: dto.userId } }
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

    async getUserProfile(user_id: string) {
        const foundUser = await this.findUserById(user_id)
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