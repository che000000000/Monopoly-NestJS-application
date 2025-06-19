import { Controller, Delete, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { UserRole } from 'src/models/user.model';
import { ExtractId } from '../auth/decorators/extract-id.decorator';
import { PregameRoomsService } from './pregame-rooms.service';

@Controller('pregame')
export class PregameRoomsController {
    constructor(private readonly pregameRoomsService: PregameRoomsService) { }

    @Authorization(UserRole.regular)
    @Post('create')
    createRoom(@ExtractId() myId: string) {
        return this.pregameRoomsService.createPregameRoom({ userId: myId })
    }

    @Authorization(UserRole.regular)
    @Delete('delete')
    deleteRoom(
        @ExtractId() myId: string,
    ) {
        return this.pregameRoomsService.deletePregameRoom({ userId: myId })
    }

    @Authorization(UserRole.regular)
    @Post('join')
    joinToRoom(
        @ExtractId() myId: string,
        @Query('room-id', new ParseUUIDPipe()) room_id: string
    ) {
        return this.pregameRoomsService.joinToRoom({
            userId: myId,
            roomId: room_id
        })
    }

    @Authorization(UserRole.regular)
    @Delete('leave')
    leaveFromRoom(@ExtractId() myId: string) {
        return this.pregameRoomsService.leaveFromRoom({
            userId: myId,
        })
    }

    @Authorization(UserRole.regular)
    @Delete('kick')
    kickFromRoom(
        @ExtractId() myId: string,
        @Query('user-id', new ParseUUIDPipe()) user_id: string
    ) {
        return this.pregameRoomsService.kickFromRoom({
            userId: myId,
            kickedUserId: user_id
        })
    }
}