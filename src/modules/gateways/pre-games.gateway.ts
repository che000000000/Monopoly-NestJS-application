import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { Server } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { MessagesService } from "../messages/messages.service";
import { SendMessageDto } from "./dto/pre-game/send-message.dto";
import { UsersService } from "../users/users.service";
import { ChatMembersService } from "../chat-members/chat-members.service";

@WebSocketGateway({
    namespace: 'pregame',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregamesRoomsGateway implements OnGatewayConnection {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly usersService: UsersService,
        private readonly chatMembersService: ChatMembersService
    ) { }

    @WebSocketServer()
    server: Server

    async handleConnection(client: SocketWithSession) {
        const userId = client.request.session.userId
        if (!userId) {
            client.disconnect()
            throw new WsException(`Unauthorized.`)
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) {
            client.disconnect()
            throw new WsException('User is not a member of the room.')
        }

        client.join(foundRoom.chatId)

        const earlyMessages = await this.messagesService.findChatMessages({
            chatId: foundRoom?.chatId,
            pageSize: 10
        })

        this.server.to(client.id).emit('room-chat', earlyMessages)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('sendMessage')
    async sendMessage(
        @MessageBody() messageText: string,
        @ConnectedSocket() client: SocketWithSession
    ) {
        const userId = client.request.session.userId
        if (!userId) {
            client.disconnect()
            throw new WsException('userId not extracted from client.')
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)

        if (!foundRoom) {
            client.disconnect()
            throw new WsException('User is not a member of the chat')
        }

        const newMessage = await this.messagesService.createMessage({
            userId: userId,
            chatId: foundRoom.chatId,
            messageText: messageText
        })
        if (!newMessage) {
            throw new WsException(`Message wasn't created.`)
        }

        this.server.to(foundRoom.chatId).emit('room-chat', newMessage)
    }
}