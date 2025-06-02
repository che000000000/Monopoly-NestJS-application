import { Body, Controller, Get, Param, Post, Query, Req, Res, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { OauthService } from '../oauth/oauth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly oauthService: OauthService,
    ) { }

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
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.logout(req, res)
    }

    @Get('oauth/:service')
    oauthLogin(@Param('service') service_name: string) {
        const foundService = this.oauthService.getServiceByName(service_name)
        return {
            oauthUrl: foundService.constructOauthUrl()
        }
    }

    @Get('oauth/callback/:service')
    async oauthCallback(
        @Req() req: Request,
        @Res() res: Response,
        @Param('service') service_name: string,
        @Query('code') code: string
    ) {
        const foundService = this.oauthService.getServiceByName(service_name)
        const oauthData = await foundService.getUserByCode(code)

        this.oauthService.oauthRegister(req, oauthData)

        return res.redirect(`http://localhost:7507`)
    }
}