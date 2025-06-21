import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { MessagesService } from "../messages/messages.service";
import { UsersService } from "../users/users.service";
import { ChatMembersService } from "../chat-members/chat-members.service";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'pregame',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregamesRoomsGateway implements OnGatewayConnection {
    constructor(
        @Inject(forwardRef(() => PregameRoomsService)) private readonly pregameRoomsService: PregameRoomsService,
        private readonly messagesService: MessagesService,
        private readonly usersService: UsersService,
        private readonly chatMembersService: ChatMembersService
    ) { }

    @WebSocketServer()
    server: Server

    throwException(socket: SocketWithSession, error_message: string) {
        socket.emit('exceptions', {
            event: 'Exception',
            message: error_message,
        })
        socket.disconnect()
    }

    async kickSokcketFromRoom(user_id: string, chat_id: string) {
        const allSockets = await this.server.fetchSockets()
        const socket = allSockets.find(socket => socket.data.userId === user_id)
        if(!socket) return

        socket?.leave(chat_id)
    }

    async handleConnection(socket: SocketWithSession) {
        const userId = socket.request.session.userId
        if (!userId) {
            this.throwException(socket, 'Unauthorized.')
            return
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) {
            this.throwException(socket, 'User is not a member of the room.')
            return
        }

        socket.join(foundRoom.chatId)

        const earlyMessages = await this.messagesService.findChatMessages({
            chatId: foundRoom?.chatId,
            pageSize: 10
        })

        this.server.to(socket.id).emit('room-chat', earlyMessages)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('sendMessage')
    async sendMessage(
        @MessageBody() messageText: string,
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const userId = socket.request.session.userId
        if (!userId) {
            throw new WsException('userId not extracted from socket.')
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)

        if (!foundRoom) {
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