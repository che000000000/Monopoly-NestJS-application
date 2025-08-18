import { Injectable } from '@nestjs/common';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { User } from 'src/models/user.model';
import { IPregameRoomMember } from './interfaces/pregame-room-member';
import { ICompressedPregameRoom, IPregameRoom } from './interfaces/pregame-room';
import { PregameRoom } from 'src/models/pregame-room.model';
import { PlayerChip } from 'src/models/player.model';

@Injectable()
export class DataFormatterService {
    formatPregameRoomMember(user: User | null, pregameRoomMember: PregameRoomMember): IPregameRoomMember {
        return {
            id: pregameRoomMember.id,
            slot: pregameRoomMember.slot,
            playerChip: pregameRoomMember.playerChip,
            isOwner: pregameRoomMember.isOwner,
            user: user
                ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                }
                : null,
            createdAt: pregameRoomMember.createdAt
        }
    }

    formatPregameRoom(pregameRoom: PregameRoom, pregameRoomMembers: IPregameRoomMember[], availableChips: PlayerChip[]): IPregameRoom {
        return {
            id: pregameRoom.id,
            members: pregameRoomMembers,
            availableChips: availableChips,
            createdAt: pregameRoom.createdAt
        }
    }

    formatCompressedPregameRoom(pregameRoom: PregameRoom): ICompressedPregameRoom {
        return {
            id: pregameRoom.id,
            createdAt: pregameRoom.createdAt
        }
    }
}