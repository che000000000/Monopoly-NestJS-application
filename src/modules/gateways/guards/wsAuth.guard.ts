import { CanActivate, ExecutionContext, Injectable, UseFilters } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class WsAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient()
        if (!client.request.session?.userId) {
            client.disconnect()
            throw new WsException('Unauthorized.')
        }
        return true
    }
}