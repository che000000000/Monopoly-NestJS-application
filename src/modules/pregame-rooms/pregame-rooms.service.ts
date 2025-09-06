import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { PregameRoomMembersService } from '../pregame-room-members/pregame-room-members.service';
import { Chat, ChatType } from 'src/models/chat.model';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { Player, PlayerChip, PlayerStatus } from 'src/models/player.model';
import { Message } from 'src/models/message.model';
import { User } from 'src/models/user.model';
import { PlayersService } from '../players/players.service';
@Injectable()
export class PregameRoomsService {
    constructor(
        @InjectModel(PregameRoom) private readonly pregameRoomsRepository: typeof PregameRoom,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly usersService: UsersService,
        private readonly playersService: PlayersService,
        private readonly chatsService: ChatsService,
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

    async create(chatId: string): Promise<PregameRoom> {
        return await this.pregameRoomsRepository.create({
            chatId
        })
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

    async getPage(pageNumber: number, pageSize: number): Promise<{ pregameRooms: PregameRoom[], totalCount: number }> {
        return {
            pregameRooms: await this.pregameRoomsRepository.findAll({
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset: (pageNumber - 1) * pageSize,
                raw: true
            }),
            totalCount: await this.getPregameRoomsCount()
        }
    }

    async getPregameRoomChatMessagesPage(userId: string, pageNumber: number, pageSize: number): Promise<{ messagesList: Message[], totalCount: number }> {
        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) {
            throw new BadRequestException(`Failed to get pregame room messages page. User isn't in the pregame room`)
        }

        const pregameRoom = await this.getOneOrThrow(pregameRoomMember.pregameRoomId)

        const pregameRoomChat = await this.chatsService.findOne(pregameRoom.chatId)
        if (!pregameRoomChat) {
            throw new InternalServerErrorException('Failed to get pregame room messages page. Pregame room chat not found.')
        }

        return await this.messagesService.getMessagesPage(pregameRoomChat.id, pageNumber, pageSize)
    }

    async initPregameRoom(userId: string): Promise<{ pregameRoom: PregameRoom, pregameRoomMember: PregameRoomMember, chat: Chat }> {
        const [user, userPlayers] = await Promise.all([
            this.usersService.findOne(userId),
            this.playersService.findAllByUserId(userId)
        ])
        if (!user) {
            throw new NotFoundException('Failed to init pregame room. User not found.')
        }
        if (userPlayers.some((player: Player) => player.status !== PlayerStatus.IS_LEFT)) {
            throw new BadRequestException(`Failed to add user to pregame room. User in the game already.`)
        }

        const newChat = await this.chatsService.create(ChatType.PREGAME)

        const newPregameRoom = await this.create(newChat.id)

        const newPregameRoomMember = await this.pregameRoomMembersService.create(newPregameRoom.id, user.id, true, PlayerChip.HAT, 1,)
        
        return {
            pregameRoom: newPregameRoom,
            pregameRoomMember: newPregameRoomMember,
            chat: newChat,
        }
    }

    async addMember(userId: string, pregameRoomId: string, slot: number): Promise<PregameRoomMember> {
        const [user, pregameRoom, userAsPregameRoomMember, userPlayers, pregameRoomMemberOtSlot, availableChips] = await Promise.all([
            this.usersService.findOne(userId),
            this.findOne(pregameRoomId),
            this.pregameRoomMembersService.findOneByUserId(userId),
            this.playersService.findAllByUserId(userId),
            this.pregameRoomMembersService.findOneBySlotAndPregameRoomId(slot, pregameRoomId),
            this.getAvailableChips(pregameRoomId)
        ])
        if (!user) {
            throw new InternalServerErrorException(`Failed to add user to pregame room. User not found`)
        }
        if (!pregameRoom) {
            throw new NotFoundException(`Failed to add user to pregame room. Pregame room not found.`)
        }
        if (userAsPregameRoomMember || userPlayers.some((player: Player) => player.status !== PlayerStatus.IS_LEFT)) {
            throw new BadRequestException(`Failed to add user to pregame room. User in pregame room member already.`)
        }
        if (userPlayers.some((player: Player) => player.status !== PlayerStatus.IS_LEFT)) {
            throw new BadRequestException(`Failed to add user to pregame room. User in game already.`)
        }
        if (pregameRoomMemberOtSlot) {
            throw new BadRequestException(`Failed to add user to pregame room. This slot is occupied already`)
        }
        
        return await this.pregameRoomMembersService.create(pregameRoom.id, user.id, false, availableChips[0], slot)
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

    async setPregameRoomMemberSlot(userId: string, slot: number): Promise<{ pregameRoom: PregameRoom, pregameRoomMembers: PregameRoomMember[] }> {
        if (slot < 1 && slot > 4) {
            throw new BadRequestException('Failed to set pregame room member slot. non existed slot selected.')
        }

        const [pregameRoomMember] = await Promise.all([
            this.pregameRoomMembersService.findOneByUserId(userId),
            this.usersService.getOneOrThrow(userId)
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

    async sendPregameRoomMessage(userId: string, messageText: string): Promise<{ message: Message, user: User, pregameRoomId: string }> {
        if (messageText.length === 0) {
            throw new BadRequestException('Failed to send pregame room message. Message text is emty.')
        }

        const [user, pregameRoomMember] = await Promise.all([
            this.usersService.findOne(userId),
            this.pregameRoomMembersService.findOneByUserId(userId)
        ])
        if (!user) {
            throw new InternalServerErrorException('Failed to send pregame room message. User not found.')
        }
        if (!pregameRoomMember) {
            throw new BadRequestException('Failed to send pregame room message. User not in the pregame room.')
        }

        const pregameRoom = await this.getOneOrThrow(pregameRoomMember.pregameRoomId)

        const pregameRoomChat = await this.chatsService.findOne(pregameRoom.chatId)
        if (!pregameRoomChat) {
            throw new InternalServerErrorException('Failed to send pregame room message. Pregame room chat not found.')
        }

        const newMessage = await this.messagesService.create(userId, pregameRoomChat.id, messageText)

        return {
            message: newMessage,
            user,
            pregameRoomId: pregameRoomMember.pregameRoomId
        }
    }

    async setPregameRoomMemberPlayerChip(userId: string, playerChip: PlayerChip): Promise<PregameRoomMember> {
        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) {
            throw new BadRequestException(`Failed to set pregame room member player chip. User not in the pregame room.`)
        }

        const availableChips = await this.getAvailableChips(pregameRoomMember.pregameRoomId)
        if (!availableChips.some((chip: PlayerChip) => chip === playerChip)) {
            throw new BadRequestException(`Failed to set pregame room member player chip. Selected chip is not available.`)
        }

        const affectedCount = await this.pregameRoomMembersService.updatePlayerChip(pregameRoomMember.id, playerChip)
        if (!affectedCount) {
            throw new InternalServerErrorException(`Failed to set pregame room member player chip.`)
        }

        return this.pregameRoomMembersService.getOneOrThrow(pregameRoomMember.id)
    }
}