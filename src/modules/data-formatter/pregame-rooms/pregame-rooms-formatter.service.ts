import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/users/model/user.model';
import { IPregameRoomMember } from './interfaces/pregame-room-member';
import { ICompressedPregameRoom, IPregameRoom } from './interfaces/pregame-room';
import { PregameRoom } from 'src/modules/pregame-rooms/model/pregame-room';
import { PlayerChip } from 'src/modules/players/model/player';
import { PregameRoomMember } from 'src/modules/pregame-room-members/model/pregame-room-member';
import { UsersService } from 'src/modules/users/users.service';
import { UsersFormatterService } from '../users/users-formatter.service';
import { PregameRoomsService } from 'src/modules/pregame-rooms/pregame-rooms.service';
import { PregameRoomMembersService } from 'src/modules/pregame-room-members/pregame-room-members.service';

@Injectable()
export class PregameRoomsFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService,
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService
    ) { }

    formatPregameRoomMember(member: PregameRoomMember, user?: User): IPregameRoomMember {
        return {
            id: member.id,
            slot: member.slot,
            playerChip: member.playerChip,
            isOwner: member.isOwner,
            user: user
                ? this.usersFormatterService.formatUser(user)
                : null,
            createdAt: member.createdAt
        }
    }

    async formatPregameRoomMemberAsync(member: PregameRoomMember): Promise<IPregameRoomMember> {
        const user = member.userId 
            ? await this.usersService.getOneOrThrow(member.userId)
            : undefined

        return this.formatPregameRoomMember(member, user)
    }

    async formatPregameRoomMembersAsync(members: PregameRoomMember[]): Promise<IPregameRoomMember[]> {
        return await Promise.all(
            members.map(m => this.formatPregameRoomMemberAsync(m))
        )
    }

    formatPregameRoom(pregameRoom: PregameRoom, members: IPregameRoomMember[], availableChips: PlayerChip[]): IPregameRoom {
        return {
            id: pregameRoom.id,
            members,
            availableChips,
            createdAt: pregameRoom.createdAt
        }
    }

    async formatPregameRoomAsync(pregameRoom: PregameRoom): Promise<IPregameRoom> {
        const [members, availableChips] = await Promise.all([
            this.pregameRoomMembersService.findAllByPregameRoomId(pregameRoom.id),
            this.pregameRoomsService.getAvailableChips(pregameRoom.id)
        ])

        return this.formatPregameRoom(
            pregameRoom,
            await this.formatPregameRoomMembersAsync(members),
            availableChips
        )
    }

    async formatPregameRoomsAsync(pregameRooms: PregameRoom[]): Promise<IPregameRoom[]> {
        return await Promise.all(
            pregameRooms.map(pr => this.formatPregameRoomAsync(pr))
        )
    }

    formatCompressedPregameRoom(pregameRoom: PregameRoom): ICompressedPregameRoom {
        return {
            id: pregameRoom.id,
            createdAt: pregameRoom.createdAt
        }
    }
}