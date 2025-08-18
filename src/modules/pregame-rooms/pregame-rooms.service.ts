import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { MessagesService } from '../messages/messages.service';
import { PregameRoomMembersService } from '../pregame-room-members/pregame-room-members.service';
import { Chat, TiedTo } from 'src/models/chat.model';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { ChatMember } from 'src/models/chat-members';
import { PlayerChip } from 'src/models/player.model';
@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly chatMembersService: ChatMembersService,
        private readonly messagesService: MessagesService
    ) { }

    async findOne(id: string): Promise<PregameRoom | null> {
        return await this.pregameRoomsRepository.findOne({
            where: { id },
            raw: true
        })
    }

    async getOneOrThrow(roomId: string): Promise<PregameRoom> {
        const foundRoom = await this.findOne(roomId)
        if (!foundRoom) {
            throw new NotFoundException(`Room doesn't exist.`)
        }
        return foundRoom
    }

    async create(): Promise<PregameRoom> {
        try {
            return await this.pregameRoomsRepository.create()
        } catch (error) {
            console.error(`Sequelize error: ${error}`)
            throw new InternalServerErrorException('Failed to create pregame room.')
        }
    }

    async destroy(id: string): Promise<number> {
        return await this.pregameRoomsRepository.destroy({
            where: { id }
        })
    }

    async updateOwnerId(ownerId: string, id: string): Promise<number> {
        const [affectedCount] = await this.pregameRoomsRepository.update(
            { ownerId },
            { where: { id } }
        )
        return affectedCount
    }

    async getPregameRoomsCount(): Promise<number> {
        return await this.pregameRoomsRepository.count()
    }

    async getAvailableChips(pregameRoomId: string): Promise<PlayerChip[]> {
        const pregameRoom = await this.getOneOrThrow(pregameRoomId)
        const pregameRoomMembers = await this.pregameRoomMembersService.findAllByPregameRoomId(pregameRoom.id)

        const allChips = Object.values(PlayerChip)

        return allChips.filter(
            (chip: PlayerChip) => !pregameRoomMembers.some((member) => member.playerChip === chip)
        )
    }

    async getPregameRoomsPage(pageNumber: number, pageSize: number): Promise<{ page: PregameRoom[], totalCount: number }> {
        return {
            page: await this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset: (pageNumber - 1) * pageSize,
                raw: true
            }),
            totalCount: await this.getPregameRoomsCount()
        }
    }

    async init(userId: string): Promise<{ pregameRoom: PregameRoom, pregameRoomMember: PregameRoomMember, chat: Chat, chatMember: ChatMember }> {
        const user = await this.usersService.findOne(userId)
        if (!user) {
            throw new NotFoundException('Failed to init pregame room. User not found.')
        }

        const newPregameRoom = await this.create()

        const [newChat, newPregameRoomMember] = await Promise.all([
            this.chatsService.create(TiedTo.PREGAME),
            this.pregameRoomMembersService.create(newPregameRoom.id, user.id, true, PlayerChip.HAT, 1,)
        ])


        const [newChatMember] = await Promise.all([
            this.chatMembersService.create(user.id, newChat.id),
            await this.chatsService.linkToPregame(newChat.id, newPregameRoom.id)
        ])

        return {
            pregameRoom: newPregameRoom,
            pregameRoomMember: newPregameRoomMember,
            chat: newChat,
            chatMember: newChatMember
        }
    }

    async addMember(userId: string, pregameRoomId: string, slot: number): Promise<PregameRoomMember> {
        const [user, userAsPregameRoomMember, pregameRoomMemberOnSlot, pregameRoom, avialableChips] = await Promise.all([
            this.usersService.findOne(userId),
            this.pregameRoomMembersService.findOneByUserId(userId),
            this.pregameRoomMembersService.findOneBySlotAndPregameRoomId(slot, pregameRoomId),
            this.findOne(pregameRoomId),
            this.getAvailableChips(pregameRoomId)
        ])
        if (!user) {
            throw new NotFoundException(`Failed to add user to pregame room. User not found`)
        }
        if (!pregameRoom) {
            throw new BadRequestException(`Failed to add user to pregame room. Pregame room doesn't exists.`)
        }
        if (userAsPregameRoomMember) {
            throw new BadRequestException('Failed to add user to pregame room. User in the pregame room already.')
        }
        if (pregameRoomMemberOnSlot) {
            throw new BadRequestException('Failed to add user to pregame room. This slot is occupied already')
        }

        return await this.pregameRoomMembersService.create(pregameRoom.id, user.id, false, avialableChips[0], slot)
    }

    async removePregameRoomMember(userId: string): Promise<PregameRoomMember> {
        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) {
            throw new NotFoundException('Failed to remove pregame room member. Pregame room member not found.')
        }

        await this.pregameRoomMembersService.destroy(pregameRoomMember.id)

        if (pregameRoomMember.isOwner === true) {
            const currentPregameRoomMembers = await this.pregameRoomMembersService.findAllByPregameRoomId(pregameRoomMember.pregameRoomId)
            currentPregameRoomMembers.length !== 0 && await this.pregameRoomMembersService.updateIsOwner(currentPregameRoomMembers[0].id, true)
        }

        return pregameRoomMember
    }

    async removePregameRoom(pregameRoomId: string): Promise<void> {
        await Promise.all([
            this.chatsService.destroyByPregameRoomId(pregameRoomId),
            this.destroy(pregameRoomId)
        ])
    }

    async setPregameRoomMemberSlot(userId: string, slot: number): Promise<{pregameRoom: PregameRoom, pregameRoomMembers: PregameRoomMember[]}> {
        if (slot < 1 && slot > 4) {
            throw new BadRequestException('Failed to set pregame room member slot. non existed slot selected.')
        }

        const [pregameRoomMember] = await Promise.all([
            this.pregameRoomMembersService.findOneByUserId(userId),
            this.usersService.getOrThrow(userId)
        ])
        if (!pregameRoomMember) {
            throw new BadRequestException('Failed to set pregame room member slot. User not in the pregame room.') 
        }

        const pregameRoomMemberWithSelectedSlot = await this.pregameRoomMembersService.findOneBySlotAndPregameRoomId(slot, pregameRoomMember.pregameRoomId)
        if (pregameRoomMemberWithSelectedSlot) {
            throw new BadRequestException('Failed to set pregame room member slot. Occupied slot selected')
        }

        const [pregameRoom] = await Promise.all([
            this.getOneOrThrow(pregameRoomMember.pregameRoomId),
            this.pregameRoomMembersService.updateSlot(pregameRoomMember.id, slot)
        ])

        const updatedPregameRoomMembers = await this.pregameRoomMembersService.findAllByPregameRoomId(pregameRoomMember.pregameRoomId)

        return {
            pregameRoom,
            pregameRoomMembers: updatedPregameRoomMembers
        }
    }
}