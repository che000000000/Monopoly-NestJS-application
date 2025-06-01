import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { User, UserRole } from 'src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UserService {
    constructor(@InjectModel(User) private readonly usersRepository: typeof User) { }

    async findUserById(user_id: string) {
        return await this.usersRepository.findOne({
            where: { id: user_id },
            raw: true
        })
    }

    async findUserByEmail(user_enmail: string) {
        return await this.usersRepository.findOne({
            where: { email: user_enmail },
            raw: true
        })
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
            password: await bcrypt.hash(dto.password, 10),
            avatarUrl: dto.avatarUrl,
            role: UserRole.regular,
            authMethod: dto.authMethod
        })
    }
}