import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { InternalServerErrorException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { SocketWithSession } from "../interfaces/socket-with-session.interface";
import { GlobalChatsService } from "src/modules/global-chat/global-chats.service";
import { GlobalChatMessagesPageDto } from "./dto/global-chat-messages-page";
import { WsAuthGuard } from "../guards/wsAuth.guard";
import { GlobalChatFormatterService } from "src/modules/data-formatter/global-chat/global-chat-formatter.service";
import { SendGlobalChatMessageDto } from "./dto/send-global-chat-message";

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
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GlobalChatMessagesPageDto
    ): Promise<void> {
        const globalChatMessagesPage = await this.globalChatsService.getGlobalChatMessagesPage(dto.pageNumber, dto.pageSize)

        socket.emit('global-chat-messages-page', {
            messagesList: await this.globalChatFormatterService.formatGlobalChatMessagesAsync(globalChatMessagesPage.messagesList),
            totalCount: globalChatMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-global-chat-message')
    async sendGlobalChatMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendGlobalChatMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const newMessage = await this.globalChatsService.sendGlobalChatMessage(userId, dto.messageText)

        this.server.to(newMessage.chatId).emit('send-global-chat-message', {
            message: await this.globalChatFormatterService.formatGlobalChatMessageAsync(newMessage)
        })
    }
}