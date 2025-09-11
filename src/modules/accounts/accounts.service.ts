import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './model/account.model';

@Injectable()
export class AccountsService {
    constructor(@InjectModel(Account) private readonly accountsRepository: typeof Account) { }

    async findAccountByUserId(user_id: string) {
        return await this.accountsRepository.findOne({
            where: { userId: user_id },
            raw: true
        })
    }

    async createAccount(dto: CreateAccountDto) {
        const newAccount = this.accountsRepository.create({
            type: dto.type,
            provider: dto.provider,
            accessToken: dto.accessToken,
            refreshToken: dto.refreshToken,
            expires: dto.expires,
            userId: dto.userId
        })

        if (!newAccount) {
            throw new Error('Account not created')
        }

        return newAccount
    }
}