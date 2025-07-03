import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server, Socket } from "socket.io";
import { BadRequestException, InternalServerErrorException, NotFoundException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { JoinPregameRoomDto } from "./dto/pregame/join-pregame-room.dto";
import { KickUserFromPregameRoomDto } from "./dto/pregame/kick-user-from-pregame-room.dto";
import { GetRoomsPageDto } from "./dto/pregame/get-rooms-page.dto";
import { SendMessageDto } from "./dto/pregame/send-message.dto";
import { GetMessagesPageDto } from "./dto/pregame/get-messages-page.dto";
import { RemovePregameSocketDto } from "./dto/pregame/remove-pregame-socket.dto";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'pregame',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly usersService: UsersService
    ) { }

    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) throw new InternalServerErrorException(`Failed to extract userId.`)
        return userId
    }

    private async findSocketById(user_id: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.find(socket => socket.data.userId === user_id)
    }

    async removeSocketFromRooms(dto: RemovePregameSocketDto): Promise<void> {
        const foundSocket = await this.findSocketById(dto.userId)
        if(!foundSocket) throw new NotFoundException(`Socket not found.`)

        const allSocketRooms = Array.from(foundSocket.rooms).filter(room => room !== foundSocket.id)
        allSocketRooms.forEach(room => foundSocket.leave(room))
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const foundRoom = await this.pregameRoomsService.findByUser(userId)
        if (!foundRoom) return

        socket.join(foundRoom.id)
    }

    async handleDisconnect(socket: SocketWithSession) {
        const allSocketRooms = Array.from(socket.rooms).filter(room => room !== socket.id)
        allSocketRooms.forEach(room => socket.leave(room))
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('rooms-page')
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetRoomsPageDto
    ) {
        const getRoomsPage = await this.pregameRoomsService.getRoomsPage({
            pageSize: dto.pageSize,
            pageNumber: dto.pageNumber
        })

        socket.emit('pregame', {
            roomsPage: getRoomsPage.roomsPage,
            totalCount: getRoomsPage.totalCount,
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('messages-page')
    async getMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetMessagesPageDto
    ) {
        const userId = this.extractUserId(socket)

        const getMessagesPage = await this.pregameRoomsService.getRoomMessagesPage({
            userId,
            pageSize: dto.pageSize,
            pageNumber: dto.pageNumber
        })

        socket.emit('pregame', {
            messagesPage: getMessagesPage.messagesPage,
            totalCount: getMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const createPregameRoom = await this.pregameRoomsService.createRoom({
            userId: userId
        })

        socket.join(createPregameRoom.newRoom.id)

        this.server.emit('pregame', {
            event: 'create',
            newPregameRoom: createPregameRoom.newRoom,
            roomMembers: createPregameRoom.roomMembers
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave')
    async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const foundRoom = await this.pregameRoomsService.findByUser(userId)
        if (!foundRoom) throw new BadRequestException(`User isn't in the pregameRoom`)

        const leftUser = await this.pregameRoomsService.removeUserFromRoom({
            userId: userId
        })

        socket.leave(foundRoom.id)

        this.server.emit('pregame', {
            event: 'left',
            leftUser: leftUser
        })

        const roomMembers = await this.usersService.findPregameRoomUsers(foundRoom.id)

        if (roomMembers.length === 0) {
            const removedRoom = await this.pregameRoomsService.removeRoom({
                roomId: foundRoom.id
            })
            this.server.emit('pregame', {
                event: 'remove',
                removedRoom
            })
        } else if (userId === foundRoom.ownerId) {
            const newOwner = await this.pregameRoomsService.appointNewOwner({
                roomId: foundRoom.id
            })
            this.server.emit('pregame', {
                event: 'new-owner',
                newOwner: {
                    id: newOwner.id,
                    name: newOwner.name,
                    avatarUrl: newOwner.avatarUrl,
                    role: newOwner.role
                },
                pregameRoom: {
                    id: foundRoom.id,
                    createdAt: foundRoom.createdAt
                }
            })
        }
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join')
    async joinPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: JoinPregameRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const joinUserToRoom = await this.pregameRoomsService.joinUserToRoom({
            userId: userId,
            roomId: dto.roomId
        })

        socket.join(joinUserToRoom.pregameRoom.id)

        this.server.emit('pregame',
            {
                event: 'join',
                pregameRoom: joinUserToRoom.pregameRoom,
                joinedUser: joinUserToRoom.joinedUser
            }
        )
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('kick')
    async kickUserFromPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: KickUserFromPregameRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const kickUserFromRoom = await this.pregameRoomsService.kickUserFromRoom({
            userId,
            kickedUserId: dto.userId
        })

        await this.removeSocketFromRooms({
            userId: kickUserFromRoom.kickedUser.id
        })

        this.server.emit('pregame', {
            event: 'kick',
            pregameRoom: kickUserFromRoom.pregameRoom,
            kickedUser: kickUserFromRoom.kickedUser
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send')
    async sendMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendMessageDto
    ) {
        const userId = this.extractUserId(socket)

        const newMessage = await this.pregameRoomsService.sendMessage({
            userId,
            messageText: dto.messageText
        })

        this.server.to(newMessage.pregameRoom.id).emit('pregame', {
            event: 'send',
            sentMessage: newMessage.sentMessage,
        })
    }
}