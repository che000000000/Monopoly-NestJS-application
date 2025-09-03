import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { InternalServerErrorException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { SocketWithSession } from "../interfaces/socket-with-session.interface";
import { ChatsService } from "src/modules/chats/chats.service";
import { GlobalChatsService } from "src/modules/global-chat/global-chats.service";
import { GlobalChatMessagesPageDto } from "./dto/global-chat-messages-page";
import { WsAuthGuard } from "../guards/wsAuth.guard";
import { GlobalChatFormatterService } from "src/modules/data-formatter/global-chat/global-chat-formatter.service";
import { SendGlobalChatMessageDto } from "./dto/send-global-chat-message";
import { Message } from "src/models/message.model";
import { UsersService } from "src/modules/users/users.service";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'global-chat',
    cors: {
        origin: true,
        credentials: true
    }
})
export class GlobalChatGateway implements OnGatewayConnection {
    constructor(
        private readonly globalChatsService: GlobalChatsService,
        private readonly chatsService: ChatsService,
        private readonly usersService: UsersService,
        private readonly globalChatFormatterService: GlobalChatFormatterService
    ) { }

    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) throw new InternalServerErrorException(`Failed to extract userId.`)
        return userId
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const globalChat = await this.globalChatsService.findGlobalChatOrCreate()

        socket.join(globalChat.id)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('global-chat-messages-page')
    private async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GlobalChatMessagesPageDto
    ): Promise<void> {
        const globalChatMessagesPage = await this.globalChatsService.getGlobalChatMessagesPage(dto.pageNumber, dto.pageSize)

        const formattedGlobalChatMessages = await Promise.all(
            globalChatMessagesPage.messagesList.reverse().map(async (message: Message) => {
                const user = await this.usersService.findOne(message.userId)
                return this.globalChatFormatterService.formatGlobalChatMessage(message, user)
            })
        )

        socket.emit('global-chat-messages-page', {
            messagesList: formattedGlobalChatMessages,
            totalCount: globalChatMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-global-chat-message')
    private async sendGlobalChatMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendGlobalChatMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendGlobalChatMessage = await this.globalChatsService.sendGlobalChatMessage(userId, dto.messageText)

        this.server.to(sendGlobalChatMessage.message.chatId).emit('send-global-chat-message', {
            message: this.globalChatFormatterService.formatGlobalChatMessage(sendGlobalChatMessage.message, sendGlobalChatMessage.user)
        })
    }
}