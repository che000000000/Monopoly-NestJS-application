import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

export const ExtractId = createParamDecorator(
    (_, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest()

        if(!request.session.userId) throw new UnauthorizedException('User not authorized.')
        return request.session.userId 
    }
)