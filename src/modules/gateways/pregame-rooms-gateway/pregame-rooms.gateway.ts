import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { InternalServerErrorException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "../filters/WsExcepton.filter";
import { PregameRoomsService } from "src/modules/pregame-rooms/pregame-rooms.service";
import { PregameRoomMembersService } from "src/modules/pregame-room-members/pregame-room-members.service";
import { UsersService } from "src/modules/users/users.service";
import { SocketWithSession } from "../interfaces/socket-with-session.interface";
import { GetPregameRoomsPageDto } from "./dto/get-pregame-rooms-page.dto";
import { GetPregameRoomMessagesPageDto } from "./dto/get-pregame-room-messages-page.dto";
import { WsAuthGuard } from "../guards/wsAuth.guard";
import { JoinPregameRoomDto } from "./dto/join-pregame-room.dto";
import { SendPregameRoomMessageDto } from "./dto/send-pregame-room-message.dto";
import { SetPeregameRoomMemberSlotDto } from "./dto/set-pregame-room-member-slot.dto";
import { SetPregameRoomMemberPlayerChipDto } from "./dto/set-pregame-room-member-player-chip.dto";
import { PregameRoomsFormatterService } from "src/modules/data-formatter/pregame-rooms/pregame-rooms-formatter.service";
import { ChatsService } from "src/modules/chats/chats.service";
import { PregameRoom } from "src/modules/pregame-rooms/model/pregame-room";
import { PregameRoomChatFormatterService } from "src/modules/data-formatter/pregame-room-chat/pregame-room-chat-formatter.service";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'pregame-rooms',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregameRoomsGateway implements OnGatewayConnection {
    constructor(
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly pregameRoomsFormatterService: PregameRoomsFormatterService,
        private readonly pregameRoomChatFormatterService: PregameRoomChatFormatterService
    ) { }

    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) throw new InternalServerErrorException(`Failed to extract userId.`)
        return userId
    }

    // private async findSocketById(id: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
    //     const allSockets = await this.server.fetchSockets()
    //     return allSockets.find(socket => socket.data.userId === id)
    // }

    // private async removeSocketFromRooms(userId: string): Promise<void> {
    //     const foundSocket = await this.findSocketById(userId)
    //     if(!foundSocket) throw new NotFoundException(`Socket not found.`)

    //     const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
    //     allSocketRooms.forEach(room => foundSocket.leave(room))
    // }

    // private async removeSocketsFromRooms(users: User[]): Promise<void> {
    //     if (users.length === 0) throw new InternalServerErrorException(`Failed to remove sockets from rooms. Users not defined.`)

    //     await Promise.all(
    //         users.map(async (user) => {
    //             await this.removeSocketFromRooms(user.id)
    //         })
    //     )
    // }

    public async emitRemovePregameRoom(pregameRoom: PregameRoom): Promise<void> {
        this.server.emit('remove-pregame-room',
            pregameRoom.id
        )
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) return

        socket.join(pregameRoomMember.pregameRoomId)
    }

    @SubscribeMessage('pregame-rooms-page')
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetPregameRoomsPageDto
    ): Promise<void> {
        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 8
        }
        const pregameRoomsPage = await this.pregameRoomsService.getPage(options.pageNumber, options.pageSize)

        socket.emit('pregame-rooms-page', {
            pregameRoomsList: await this.pregameRoomsFormatterService.formatPregameRoomsAsync(pregameRoomsPage.pregameRooms),
            totalCount: pregameRoomsPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create-pregame-room')
    async createPregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const newPregameRoom = await this.pregameRoomsService.initPregameRoom(userId)
        socket.join(newPregameRoom.id)

        this.server.emit('create-pregame-room', 
            await this.pregameRoomsFormatterService.formatPregameRoomAsync(newPregameRoom)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave-pregame-room')
    async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const leftPregameRoomMember = await this.pregameRoomsService.removePregameRoomMember(userId)
        socket.leave(leftPregameRoomMember.pregameRoomId)

        const [pregameRoom, currentPregameRoomMembers] = await Promise.all([
            this.pregameRoomsService.getOneOrThrow(leftPregameRoomMember.pregameRoomId),
            this.pregameRoomMembersService.findAllByPregameRoomId(leftPregameRoomMember.pregameRoomId)
        ])

        if (currentPregameRoomMembers.length === 0) {
            await this.chatsService.destroy(pregameRoom.chatId)
            await this.pregameRoomsService.destroy(pregameRoom.id)

            this.server.emit('remove-pregame-room', 
                pregameRoom.id
            )
            return
        }

        this.server.emit('leave-pregame-room', {
            pregameRoom: await this.pregameRoomsFormatterService.formatPregameRoomAsync(pregameRoom),
            leftMember: await this.pregameRoomsFormatterService.formatPregameRoomMemberAsync(leftPregameRoomMember)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join-pregame-room')
    async joinPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: JoinPregameRoomDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const newPregameRoomMember = await this.pregameRoomsService.addMember(userId, dto.pregameRoomId, dto.slot)
        socket.join(newPregameRoomMember.pregameRoomId)

        const pregameRoom = await this.pregameRoomsService.getOneOrThrow(dto.pregameRoomId)

        this.server.emit('join-pregame-room', {
            pregameRoom: await this.pregameRoomsFormatterService.formatPregameRoomAsync(pregameRoom),
            joinedMember: await this.pregameRoomsFormatterService.formatPregameRoomMemberAsync(newPregameRoomMember)
        })
    }   

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('set-pregame-room-member-slot')
    async setPregameRoomMemberSlot(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SetPeregameRoomMemberSlotDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const pregameRoom = await this.pregameRoomsService.setPregameRoomMemberSlot(userId, dto.slot)

        this.server.emit('set-pregame-room-member-slot', 
            await this.pregameRoomsFormatterService.formatPregameRoomAsync(pregameRoom)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('set-pregame-room-player-chip')
    async setPregameRoomPlayerChip(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: SetPregameRoomMemberPlayerChipDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const updatedPregameRoomMember = await this.pregameRoomsService.setPregameRoomMemberPlayerChip(userId, dto.playerChip)

        const pregameRoom = await this.pregameRoomsService.getOneOrThrow(updatedPregameRoomMember.pregameRoomId)

        this.server.emit('set-pregame-room-player-chip',
            await this.pregameRoomsFormatterService.formatPregameRoomAsync(pregameRoom)
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pregame-room-messages-page')
    async getPregameRoomChatMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetPregameRoomMessagesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 12
        }

        const pregameRoomChatMessagesPage = await this.pregameRoomsService.getPregameRoomChatMessagesPage(userId, options.pageNumber, options.pageSize)

        socket.emit('pregame-room-messages-page', {
            messagesList: await this.pregameRoomChatFormatterService.formatPregameRoomChatMessagesAsync(pregameRoomChatMessagesPage.messagesList),
            totalCount: pregameRoomChatMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-pregame-room-message')
    async sendPregameRoomMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendPregameRoomMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendPregameRoomMessage = await this.pregameRoomsService.sendPregameRoomMessage(userId, dto.messageText)

        this.server.to(sendPregameRoomMessage.pregameRoomId).emit('send-pregame-room-message',
            await this.pregameRoomChatFormatterService.formatPregameRoomChatMessageAsync(sendPregameRoomMessage.message),
        )
    }
}