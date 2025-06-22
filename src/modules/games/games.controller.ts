import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { GamesService } from './games.service';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { UserRole } from 'src/models/user.model';
import { ExtractId } from '../auth/decorators/extract-id.decorator';

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Authorization(UserRole.regular)
    @Post('create/:roomId')
    createMatch(
        @Param('roomId', new ParseUUIDPipe() ) room_id: string,
        @ExtractId() myId: string
    ) {
        return this.gamesService.createGame({
            roomId: room_id,
            userId: myId
        })
    }
}