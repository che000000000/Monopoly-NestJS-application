import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { ErrorTypes } from "./constants/error-types";
import { JoinPregameRoomDto } from "./dto/pregame/join-pregame-room.dto";
import { KickUserFromPregameRoomDto } from "./dto/pregame/kick-user-from-pregame-room.dto";

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
        private readonly usersService: UsersService
    ) { }
    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `Failed to extract userId.`
            })

        }
        return userId
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) return

        await socket.join([foundRoom.id, foundRoom.chatId])
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const createPregameRoom = await this.pregameRoomsService.createRoom({
            userId: userId
        })

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

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) throw new WsException({
            errorType: ErrorTypes.BadRequest,
            message: `User isn't in the pregameRoom`,
        })

        const leftUser = await this.pregameRoomsService.removeUserFromRoom({
            userId: userId
        })

        this.server.emit('pregame', {
            event: 'left',
            leftUser: leftUser
        })

        const roomMembers = await this.usersService.findPregameRoomUsers({
            roomId: foundRoom.id
        })

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

    @SubscribeMessage('join')
    async joinPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: JoinPregameRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const joinUserToRoom = await this.pregameRoomsService.joinUserToRoom({
            userId: userId,
            roomId: dto.roomId
        })

        this.server.emit('pregame',
            {
                event: 'join',
                pregameRoom: joinUserToRoom.pregameRoom,
                joinedUser: joinUserToRoom.joinedUser
            }
        )
    }

    @SubscribeMessage('kick')
    async kickUserFromPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: KickUserFromPregameRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const kickUserFromRoom = await this.pregameRoomsService.kickUserFromRoom({
            userId,
            kickedUserId: dto.kickedUserId
        })

        this.server.emit('pregame', {
            event: 'kick',
            pregameRoom: kickUserFromRoom.pregameRoom,
            kickedUser: kickUserFromRoom.kickedUser
        })
    }
}