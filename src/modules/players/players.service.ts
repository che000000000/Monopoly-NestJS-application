import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from 'src/models/player.model';
import { CreatePlayerDto } from './dto/create-player.dto';
import { DestroyPlayerDto } from './dto/destroy-player.dto';
import { UsersService } from '../users/users.service';
import { FormattedPlayer } from './interfaces/formatted-player.interface';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player) private readonly playersRepository: typeof Player,
        private readonly usersService: UsersService
    ) { }

    async formatPlayer(player: Player): Promise<FormattedPlayer> {
        const recivedUser = await this.usersService.getUser(player.userId)
        return {
            id: player.id,
            turnNumber: player.turnNumber,
            playerHaveTurn: false,
            user: {
                id: recivedUser.id,
                name: recivedUser.name,
                avatarUrl: recivedUser.avatarUrl,
                role: recivedUser.role
            },
            fieldId: player.fieldId
        }
    }

    async findPlayer(playerId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: { id: playerId }
        })
    }

    async getPlayer(playerId: string): Promise<Player> {
        const receivedPlayer = await this.findPlayer(playerId)
        if (!receivedPlayer) throw new NotFoundException(`Player doesn't exists.`)
        return receivedPlayer
    }

    async getGamePlayers(gameId: string): Promise<Player[]> {
        return await this.playersRepository.findAll({
            where: { gameId }
        })
    }

    async findGamePlayerByTurn(gameId: string, turnNumber: number): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                gameId,
                turnNumber
            }
        })
    }

    async findPlayerByUser(userId: string): Promise<Player | null> {
        return await this.playersRepository.findOne({
            where: {
                userId
            },
            raw: true
        })
    }

    async createPlayer(dto: CreatePlayerDto): Promise<Player> {
        return await this.playersRepository.create({
            hisTurn: dto.turnNumber === 1 ? true : false,
            turnNumber: dto.turnNumber,
            fieldId: dto.fieldId,
            gameId: dto.gameId,
            userId: dto.userId
        })
    }

    async destroyPlayer(dto: DestroyPlayerDto): Promise<number> {
        return await this.playersRepository.destroy({
            where: { id: dto.playerId }
        })
    }
}