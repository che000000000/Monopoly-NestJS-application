import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { MessagesService } from "../messages/messages.service";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { UsersService } from "../users/users.service";
import { throwException } from "./common/throw-ws-exception";
import { JoinRoomDto } from "./dto/pregame/join-room.dto";
import { KickFromRoomDto } from "./dto/pregame/kick-from-room.dto";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'pregame',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregameGateway implements OnGatewayConnection {
    constructor(
        @Inject(forwardRef(() => PregameRoomsService)) private readonly pregameRoomsService: PregameRoomsService,
        private readonly messagesService: MessagesService,
        private readonly usersService: UsersService
    ) { }

    @WebSocketServer()
    server: Server

    extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) {
            throw new WsException('userId not extracted from socket.')
        }
        return userId
    }

    async kickSokcketFromRoom(user_id: string, chat_id: string): Promise<boolean> {
        const allSockets = await this.server.fetchSockets()
        const socket = allSockets.find(socket => socket.data.userId === user_id)
        if (!socket) return false

        socket?.leave(chat_id)
        return true
    }

    async handleConnection(socket: SocketWithSession) {
        const userId = socket.request.session.userId
        if (!userId) {
            throwException(socket, 'Unauthorized.')
            return
        }

        const pregameRoomsPage = await this.pregameRoomsService.getRoomsPage({
            pageSize: 12,
            pageNumber: 1
        })

        socket.emit('pregame', pregameRoomsPage)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const userId = this.extractUserId(socket)

        const newPregameRoom = await this.pregameRoomsService.createRoom({ userId: userId })
        if (!newPregameRoom) {
            throw new WsException(`Pregame room wasn't created.`)
        }

        socket.join(newPregameRoom.chatId)
        this.server.emit('pregame', {
            event: 'create_room',
            createdRoom: newPregameRoom,
            message: `Created new pregame room ${newPregameRoom.id}`
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join')
    async joinRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: JoinRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const [foundUser, pregameRoom] = await Promise.all([
            this.usersService.findUserById(userId),
            this.pregameRoomsService.joinRoom({
                userId: userId,
                roomId: dto.roomId
            })
        ])
        if (!foundUser || !pregameRoom) {
            throw new WsException('Failed join room.')
        }

        socket.join(pregameRoom.chatId)
        this.server.to(pregameRoom.chatId).emit('pregame', {
            event: 'join',
            joinedUser: foundUser,
            message: `${foundUser.name} entered the room.` 
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave')
    async leaveRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const foundUser = await this.usersService.findUserById(userId)
        if (!foundUser?.pregameRoomId) {
            throw new WsException('User not in the pregame room.')
        }

        const foundRoom = await this.pregameRoomsService.findRoomById(foundUser.pregameRoomId)
        if (!foundRoom) {
            throw new WsException('Room not found')
        }

        await this.pregameRoomsService.leaveRoom({
            userId,
            roomId: foundRoom.id
        })

        this.server.to(foundRoom.chatId).emit('pregame', {
            event: 'leave',
            leftUser: foundUser,
            message: `${foundUser.name} left the room.`
        })
        socket.leave(foundRoom.chatId)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('kick')
    async kickFromRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: KickFromRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const [foundRoom, kickedUser] = await Promise.all([
            this.pregameRoomsService.findRoomByUserId(userId),
            this.usersService.findUserById(dto.userId)
        ])

        if (!kickedUser) {
            throw new WsException(`Kicked users doesn't exists.`)
        }
        if (foundRoom?.ownerId !== userId) {
            throw new WsException(`User isn't the owner of the room`)
        }
        if (userId === dto.userId) {
            throw new WsException(`You're can't kick yourself.`)
        }

        const isKicked = await this.pregameRoomsService.kickFromRoom({
            userId: dto.userId,
            roomId: foundRoom.id
        })
        if (!isKicked) {
            throw new WsException('Failed to delete records from database.')
        }

        console.log(foundRoom.chatId, '   ', kickedUser.name)

        this.server.to(foundRoom.chatId).emit('pregame', {
            event: 'kick',
            kickedUser: kickedUser,
            message: `${kickedUser.name} was kicked from the room.`
        })
        await this.kickSokcketFromRoom(dto.userId, foundRoom.chatId)
    }
}