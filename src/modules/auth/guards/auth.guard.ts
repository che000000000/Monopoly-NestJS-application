import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "src/modules/users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()

        if (!request.session.userId) {
            throw new UnauthorizedException('User not authorized.')
        }

        const foundUser = await this.usersService.find(request.session.userId)
        if(!foundUser) throw new UnauthorizedException(`Can't find user.`)

        request.user = foundUser

        return true
    }
}