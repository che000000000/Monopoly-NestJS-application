import { Injectable } from '@nestjs/common';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { User } from 'src/models/user.model';
import { IPregameRoomMember } from './interfaces/pregame-room-member';

@Injectable()
export class ResponseFormatterService {
    formatPregameRoomMember(user: User, pregameRoomMember: PregameRoomMember): IPregameRoomMember {
        return {
            id: pregameRoomMember.id,
            slot: pregameRoomMember.slot,
            isOwner: pregameRoomMember.isOwner,
            user: {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role
            },
            createdAt: pregameRoomMember.createdAt
        }
    }
}