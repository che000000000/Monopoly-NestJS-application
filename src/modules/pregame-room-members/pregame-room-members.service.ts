import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';

@Injectable()
export class PregameRoomMembersService {
    constructor(
        @InjectModel(PregameRoomMember) private readonly pregameRoomMembersRepository: typeof PregameRoomMember,
    ) { }

    async findOne(id: string): Promise<PregameRoomMember | null> {
        return await this.pregameRoomMembersRepository.findOne({
            where: { id }
        })
    }

    async findOneByUserId(userId: string): Promise<PregameRoomMember | null> {
        return await this.pregameRoomMembersRepository.findOne({
            where: {
                userId
            }
        })
    }

    async findOneByPregameRoomId(pregameRoomId: string): Promise<PregameRoomMember | null> {
        return await this.pregameRoomMembersRepository.findOne({
            where: { pregameRoomId }
        })
    }

    async findAllByPregameRoomId(pregameRoomId: string): Promise<PregameRoomMember[]> {
        return await this.pregameRoomMembersRepository.findAll({
            where: { pregameRoomId }
        })
    }

    async findOneBySlotAndPregameRoomId(pregameRoomId: string, slot: number): Promise<PregameRoomMember | null> {
        return await this.pregameRoomMembersRepository.findOne({
            where: {
                pregameRoomId,
                slot
            }
        })
    }

    async getOneOrThrow(pregameRoomMemberId: string): Promise<PregameRoomMember> {
        const foundPregameRoomMember = await this.findOne(pregameRoomMemberId)
        if (!foundPregameRoomMember) throw new NotFoundException('Failed to get pregame room member. Pregame room member not found.')
        return foundPregameRoomMember
    }

    async create(pregameRoomId: string, userId: string, isOwner: boolean, slot: number): Promise<PregameRoomMember> {
        try {
            return await this.pregameRoomMembersRepository.create({ slot, isOwner, userId, pregameRoomId })
        } catch (error) {
            console.error(`Sequelize error: ${error}`)
            throw new InternalServerErrorException(`Failed to create pregame room member.`)
        }
    }

    async destroy(pregameRoomMemberId: string): Promise<number> {
        return await this.pregameRoomMembersRepository.destroy({
            where: { id: pregameRoomMemberId }
        })
    }
}