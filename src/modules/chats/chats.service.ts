import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat, TiedTo } from 'src/models/chat.model';

@Injectable()
export class ChatsService {
    constructor(@InjectModel(Chat) private readonly chatsRepository: typeof Chat) { }

    async findOne(id: string): Promise<Chat | null> {
        return await this.chatsRepository.findOne({
            where: { id },
        })
    }

    async getOneOrThrow(id: string): Promise<Chat> {
        const foundChat = await this.findOne(id)
        if (!foundChat) throw new NotFoundException('Failed to get chat. Chat not found.')
        return foundChat
    }

    async create(tiedTo: TiedTo): Promise<Chat> {
        return await this.chatsRepository.create({ tiedTo })
    }

    async destroy(id: string): Promise<number> {
        return await this.chatsRepository.destroy({
            where: { id }
        })
    }

    async update(id: string, fieldsToUpdate: Object): Promise<number> {
        try {
            const [affectedCount] = await this.chatsRepository.update(
                fieldsToUpdate,
                { where: { id } }
            )
            return affectedCount
        } catch (error) {
            console.error(`Sequelize error: ${error}`)
            throw new InternalServerErrorException(`Failed to create pregame room member.`)
        }
    }

    async linkToPregame(chatId: string, pregameRoomId: string): Promise<number> {
        return await this.update(chatId, {
            gameId: null,
            pregameRoomId,
            tiedTo: TiedTo.PREGAME
        })
    }

    async linkToGame(chatId: string, gameId: string): Promise<number> {
        return await this.update(chatId, {
            pregameRoomId: null,
            gameId,
            tiedTo: TiedTo.GAME
        })
    }
}