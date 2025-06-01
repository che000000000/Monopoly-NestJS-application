import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    getUserProfile(@Query('user-id', new ParseUUIDPipe({ optional: true })) user_id: string) {
        return this.usersService.getUserProfile(user_id)
    }
}