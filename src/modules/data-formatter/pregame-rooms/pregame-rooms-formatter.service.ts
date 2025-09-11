import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/users/model/user.model';
import { IPregameRoomMember } from './interfaces/pregame-room-member';
import { ICompressedPregameRoom, IPregameRoom } from './interfaces/pregame-room';
import { PregameRoom } from 'src/modules/pregame-rooms/model/pregame-room';
import { PlayerChip } from 'src/modules/players/model/player';
import { Message } from 'src/modules/messages/model/message';
import { IPregameRoomChatMessage } from './interfaces/pregame-room-chat-message';
import { PregameRoomMember } from 'src/modules/pregame-room-members/model/pregame-room-member';

@Injectable()
export class PregameRoomsFormatterService {
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

    formatPregameRoomChatMessage(message: Message, user: User | null): IPregameRoomChatMessage {
        return {
            id: message.id,
            text: message.text,
            sender: user
                ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                }
                : null,
            createdAt: message.createdAt
        }
    }
}