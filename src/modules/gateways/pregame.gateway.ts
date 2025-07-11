import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { convertPregameRoomMember } from "./converters/pregame-room-member";
import { JoinPregameRoomDto } from "./dto/pregame/join-pregame-room.dto";
import { convertCommonPregameRoom, convertPregameRoomWithMembers } from "./converters/pregame-room";
import { GetRoomsPageDto } from "./dto/pregame/get-rooms-page.dto";
import { KickFromRoomDto } from "./dto/pregame/kick-from-room.dto";
import { SendMessageDto } from "./dto/pregame/send-message.dto";
import { MessagesService } from "../messages/messages.service";
import { convertPregameRoomMessage } from "./converters/pregame-room-message";
import { GetMessagesPageDto } from "./dto/pregame/get-messages-page.dto";

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

    async removeSocketFromRooms(userId: string): Promise<void> {
        const foundSocket = await this.findSocketById(userId)
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
        const pregameRoomsPage = await this.pregameRoomsService.getPregameRoomsPage(dto.pageNumber, dto.pageSize)

        const convertedPregameRooms = await Promise.all(
            pregameRoomsPage.page.map(async (pregameRoom) => {
                const pregameRoomMembers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
                return await convertPregameRoomWithMembers(pregameRoom, pregameRoomMembers)
            })
        )

        socket.emit('pregame', {
            event: 'rooms-page',
            pregameRoomsPage: convertedPregameRooms,
            totalCount: pregameRoomsPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('messages-page')
    async getMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetMessagesPageDto
    ) {
        const userId = this.extractUserId(socket)

        const pregameRoom = await this.pregameRoomsService.findByUser(userId)
        if (!pregameRoom) throw new BadRequestException(`Failed to get pregame room's messages page. User isn't in the pregame room.`)

        const messagesPage = await this.pregameRoomsService.getPregameRoomMessagesPage(pregameRoom, dto.pageNumber, dto.pageSize)

        const convertedMessagesPage = await Promise.all(
            messagesPage.page.map(async (message) => {
                const userSender = await this.usersService.getOrThrow(message.userId)
                return convertPregameRoomMessage(userSender, pregameRoom, message)
            })
        )

        socket.emit('pregame', {
            event: 'pregame-room-messages-page',
            messagesPage: convertedMessagesPage,
            totalCount: messagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async create(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const receivedUser = await this.usersService.getOrThrow(userId)
        if (receivedUser.pregameRoomId || receivedUser.gameId) throw new BadRequestException(`Failed to create new pregame room. User in the pregame room or game already.`)

        const newPregameRoom = await this.pregameRoomsService.initPregameRoom(userId)
        socket.join(newPregameRoom.id)

        this.server.emit('pregame', {
            event: 'create-pregame-room',
            newPregameRoom: {
                id: newPregameRoom.id,
                members: [convertPregameRoomMember(receivedUser, newPregameRoom)],
                createdAt: newPregameRoom.createdAt
            }
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave')
    async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const [user, pregameRoom] = await Promise.all([
            this.usersService.find(userId),
            this.pregameRoomsService.findByUser(userId)
        ])
        if (!user) throw new NotFoundException(`Failed to leave from pregame room. User not found.`)
        if (!pregameRoom) throw new BadRequestException(`Failed to leave from pregame room. User not in the pregame room.`)

        await this.pregameRoomsService.removeUserFromRoom(user, pregameRoom)
        socket.leave(pregameRoom.id)

        this.server.emit('pregame', {
            event: 'left-user',
            pregameRoom: convertCommonPregameRoom(pregameRoom),
            leftUser: convertPregameRoomMember(user, pregameRoom)
        })

        const pregameRoomMembers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
        if (pregameRoomMembers.length < 1) {
            await this.pregameRoomsService.removeRoom(pregameRoom)

            this.server.emit('pregame', {
                event: 'remove-pregame-room',
                pregameRoom: convertCommonPregameRoom(pregameRoom)
            })

            return
        }

        if (user.id === pregameRoom.ownerId) {
            const newOwner = await this.pregameRoomsService.chooseNewOwner(pregameRoom)

            this.server.emit('pregame', {
                event: 'new-pregame-room-owner',
                pregameRoom: convertCommonPregameRoom(pregameRoom),
                newOwner: convertPregameRoomMember(newOwner, pregameRoom)
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

        const [user, pregameRoom] = await Promise.all([
            this.usersService.find(userId),
            this.pregameRoomsService.find(dto.pregameRoomId)
        ])
        if (!user) throw new NotFoundException(`Failed to join pregame room. User not found.`)
        if (!pregameRoom) throw new BadRequestException(`Failed to join pregame room. Pregame room not found.`)

        await this.pregameRoomsService.joinUserToRoom(user, pregameRoom)
        socket.join(pregameRoom.id)
        
        this.server.emit('pregame', {
            event: 'joined-user',
            pregameRoom: convertCommonPregameRoom(pregameRoom),
            joinedUser: convertPregameRoomMember(user, pregameRoom)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('kick')
    async kickUserFromPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: KickFromRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const [pregameRoom, kickedUser] = await Promise.all([
            this.pregameRoomsService.findByUser(userId),
            this.usersService.find(dto.userId)
        ])
        if (!pregameRoom) throw new BadRequestException(`Failed to kick user from pregame room. You're not in the pregame room`)
        if (pregameRoom.ownerId !== userId) throw new ForbiddenException(`Failed to kick user from pregame room. Must be owner of this pregame room.`)
        if (!kickedUser) throw new BadRequestException(`Failed to kick user from pregame room. User doesn't exist.`)
        if (kickedUser.pregameRoomId !== pregameRoom.id) throw new BadRequestException(`Failed to kick user from pregame room. Kicked user not in this pregame room.`)

        await this.pregameRoomsService.removeUserFromRoom(kickedUser, pregameRoom)

        this.server.except(pregameRoom.id).emit('pregame', {
            event: 'left-user',
            pregameRoom: convertCommonPregameRoom(pregameRoom),
            leftUser: convertPregameRoomMember(kickedUser, pregameRoom)
        })
        this.server.to(pregameRoom.id).emit('pregame', {
            event: 'kick-user',
            pregameRoom: convertCommonPregameRoom(pregameRoom),
            leftUser: convertPregameRoomMember(kickedUser, pregameRoom)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send')
    async sendMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendMessageDto
    ) {
        const userId = this.extractUserId(socket)

        const user = await this.usersService.find(userId)
        if (!user) throw new NotFoundException(`Failed to send message. User not found.`)
        if (!user.pregameRoomId) throw new BadRequestException(`Failed to send message. User isn't in the pregame room.`)

        const pregameRoom = await this.pregameRoomsService.getOrThrow(user.pregameRoomId)

        const newMessage = await this.pregameRoomsService.sendMessage(user, pregameRoom, dto.messageText)
        this.server.to(pregameRoom.id).emit('pregame', {
            event: 'send-message',
            newMessage: convertPregameRoomMessage(user, pregameRoom, newMessage)
        })
    }
}