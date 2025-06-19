import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { GamesService } from './games.service';

@Controller('matches')
export class MatchesController {
    constructor(private readonly gamesService: GamesService) { }

    @Post('create')
    createMatch(@Body(new ValidationPipe) dto: CreateGameDto) {
        return this.gamesService.createMatch(dto)
    }
}