import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthMethod, User } from 'src/modules/users/model/user.model';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { formatUser } from './formatters/user';
import { FormattedUser } from './formatters/interfaces/user';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService
    ) { }

    async registerUser(dto: RegisterDto): Promise<void> {
        if (dto.password !== dto.repeatPassword) throw new BadRequestException(`Passwords don't match.`)
        const foundUser = await this.usersService.findByEmail(dto.email)
        if (foundUser) throw new BadRequestException(`This email is using already.`)

        await this.usersService.createUser({
            email: dto.email,
            name: 'unnamed',
            password: dto.password,
            authMethod: AuthMethod.CREDENTIALS
        })
    }

    async login(req: Request, dto: LoginDto): Promise<FormattedUser> {
        const foundUser = await this.usersService.findByEmail(dto.email)

        if (!foundUser) throw new NotFoundException('Incorrect email or password.')
        if (foundUser?.authMethod === AuthMethod.GOOGLE && !foundUser.password ) throw new BadRequestException('Failed to login. Wrong auth method.')
        const isValidPassword = await bcrypt.compare(dto.password, foundUser.password)
        if (!isValidPassword) throw new NotFoundException('Incorrect email or password.')

        await this.saveSession(req, foundUser)
        return formatUser(foundUser)
    }

    async logout(req: Request, res: Response): Promise<void> {
        return this.destroySession(req, res)
    }

    async destroySession(req: Request, res: Response): Promise<void> {
        return new Promise((resolve, reject) => {
            req.session.destroy(error => {
                if (error) reject(
                    new InternalServerErrorException(`Can't destroy session.`)
                )
                res.clearCookie(`${this.configService.get('sessions.name')}`)
                resolve()
            })
        })
    }

    async saveSession(req: Request, user: User) {
        return new Promise((resolve, reject) => {
            req.session.userId = user.id
            req.session.save(error => {
                if (error) reject(
                    new InternalServerErrorException(`Can't save session.`)
                )
                resolve(user)
            })
        })
    }
}