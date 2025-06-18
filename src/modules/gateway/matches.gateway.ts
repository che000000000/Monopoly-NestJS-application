import { WebSocketGateway, WebSocketServer, OnGatewayConnection, WsException, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guards/wsAuth.guard';
import { UsersService } from '../users/users.service';
import { SocketWithSession } from './interfaces/socket-with-session.interface';

@WebSocketGateway({
    namespace: 'matches',
    cors: {
        origin: true, // нужно достать базовый url
        credentials: true,
    },
})
export class MatchesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly usersService: UsersService) { }

    @WebSocketServer()
    server: Server;

    handleConnection(client: SocketWithSession) {
        const userId = client.request.session.userId
        if (!userId) {
            client.disconnect()
        }
    }

    handleDisconnect(client: Socket) {
        client.disconnect()
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('sendMessage')
    async onNewMessage(
        @MessageBody() messageText: string,
        @ConnectedSocket() client: SocketWithSession
    ) {
        const userId = client.request.session.userId
        if(!userId) throw new WsException('Unauthorized.')

        const foundUser = await this.usersService.findUserById(userId)
        if (!foundUser) throw new WsException('User not found.')

        this.server.emit('onMessage', `${foundUser.name} | ${messageText}`)
    }
}