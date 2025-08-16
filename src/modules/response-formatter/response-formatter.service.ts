import { Injectable } from '@nestjs/common';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { User } from 'src/models/user.model';
import { IPregameRoomMember } from './interfaces/pregame-room-member';
import { IPregameRoom } from './interfaces/pregame-room';
import { PregameRoom } from 'src/models/pregame-room.model';

@Injectable()
export class ResponseFormatterService {
    formatPregameRoomMember(user: User | null, pregameRoomMember: PregameRoomMember): IPregameRoomMember {
        return {
            id: pregameRoomMember.id,
            slot: pregameRoomMember.slot,
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

    formatPregameRoom(pregameRoom: PregameRoom, pregameRoomMembers: IPregameRoomMember[]): IPregameRoom {
        return {
            id: pregameRoom.id,
            members: pregameRoomMembers,
            createdAt: pregameRoom.createdAt
        }
    }
}