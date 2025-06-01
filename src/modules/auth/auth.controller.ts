import { Body, Controller, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body(ValidationPipe) dto: RegisterDto) {
        return this.authService.registerUser(dto)
    }

    @Post('login')
    login(
        @Body(ValidationPipe) dto: LoginDto,
        @Req() req: Request
    ) {
        return this.authService.login(req, dto)
    }

    @Post('logout')
    logout(
        @Req() req: Request,
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.logout(req, res)
    }
}