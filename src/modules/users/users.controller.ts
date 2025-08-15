import { Controller, Get, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from 'src/models/user.model';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { ExtractId } from '../auth/decorators/extract-id.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard)
    @Authorization(UserRole.REGULAR)
    @Get('profile')
    getUserProfile(
        @ExtractId() myId: string,
        @Query('user-id', new ParseUUIDPipe({ optional: true })) user_id: string
    ) {
        return this.usersService.getUserProfile(user_id ? user_id : myId)
    }
}