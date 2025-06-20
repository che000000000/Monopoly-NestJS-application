import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { Server } from "socket.io";

@WebSocketGateway({
    namespace: 'pregame',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregamesRoomsGateway implements OnGatewayConnection {
    constructor(private readonly pregameRoomsService: PregameRoomsService) { }

    @WebSocketServer()
    server: Server

    handleConnection(client: SocketWithSession) {
        const userId = client.request.session.userId;
        if (!userId) {
            client.disconnect()
        }
    }

    @SubscribeMessage('sendMessage')
    async sendMessage(
        @MessageBody() messageText: string,
        @ConnectedSocket() client: SocketWithSession
    ) {
        
    }
}