import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OauthModuleOptionsType, oauthModuleSymbol } from './types/module-options.types';
import { BaseOauthService } from './services/base-oauth.service';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { OauthRegisterDto } from './dto/oauthRegister.dto';

@Injectable()
export class OauthService {
    constructor(
        @Inject(oauthModuleSymbol) private readonly options: OauthModuleOptionsType,
        private readonly usersService: UsersService,
        private readonly accountsService: AccountsService
    ) { }

    getServiceByName(service_name: string): BaseOauthService {
        const foundService = this.options.services.find(service => service.name === service_name)
        if (foundService) return foundService
        else throw new NotFoundException('Oauth service not found')
    }

    async oauthRegister(dto: OauthRegisterDto) {
        console.log(dto)
        const userExists = await this.usersService.findUserByEmail(dto.email)
        if (!userExists) {
            await this.usersService.createUser({
                email: dto.email,
                name: dto.name,
                avatarUrl: dto.picture,
                authMethod: dto.provider
            })
        }

        const newUser = await this.usersService.findUserByEmail(dto.email)
        if (!newUser) {
            throw new NotFoundException(`Can't create user by oauth respone data.`)
        }

        const accountExists = await this.accountsService.findAccountByUserId(newUser.id)
        if (!accountExists) {
            await this.accountsService.createAccount({
                type: dto.type,
                provider: dto.provider,
                accessToken: dto.accessToken,
                refreshToken: dto.refreshToken,
                expires: dto.expires,
                userId: newUser.id
            })
        }
        const newAccount = await this.accountsService.findAccountByUserId(newUser.id)
        if (!newAccount) {
            throw new NotFoundException(`Can't create account by oauth respone data.`)
        }
    }
}