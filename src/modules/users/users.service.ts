import { BadRequestException, ConflictException, Injectable, UseGuards } from '@nestjs/common';
import { User, UserRole } from 'src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { RolesGuard } from '../auth/guards/roles.guard';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User) private readonly usersRepository: typeof User) { }

    async findUserById(user_id: string) {
        return await this.usersRepository.findOne({
            where: { id: user_id },
            raw: true
        })
    }

    async findUserByEmail(user_email: string) {
        return await this.usersRepository.findOne({
            where: { email: user_email },
            raw: true
        })
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
            isVerified: foundUser.isVerified
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
            role: UserRole.regular,
            authMethod: dto.authMethod
        })
    }
}