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
export class MatchesGateway implements OnGatewayConnection {
    constructor(private readonly usersService: UsersService) { }

    @WebSocketServer()
    server: Server;

    handleConnection(client: SocketWithSession) {
        const userId = client.request.session.userId
        if (!userId) {
            client.disconnect()
        }
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

        this.server.emit('serverMessages', `${foundUser.name}: ${messageText}`)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('throwDice')
    async throwTheDice(@ConnectedSocket() client: SocketWithSession) {
        const min = 1
        const max = 6
        const dices: number[] = new Array(2)
        let summ = 0

        for(let i = 0; i < dices.length; i++) {
            dices[i] = Math.floor(Math.random() * (max - min + 1) + min)
            summ += dices[i]
        }
        

        const userId = client.request.session.userId
        if(!userId) throw new WsException('Unauthorized.')

        const foundUser = await this.usersService.findUserById(userId)
        if(!foundUser) throw new WsException('User not found')

        this.server.emit('matchMaster', `${foundUser.name} бросил: ${dices.join(' ')}. Сумма = ${summ}`)
    }
}