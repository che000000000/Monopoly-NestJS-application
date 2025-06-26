import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { ErrorTypes } from "./constants/error-types";
import { JoinRoomDto } from "./dto/pregame/join-room.dto";

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

        const isUserInTheRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (isUserInTheRoom) throw new WsException({
            errorType: ErrorTypes.BadRequest,
            message: `User is already in the room`,
        })

        const newPregameRoom = await this.pregameRoomsService.initRoom({
            userId: userId
        })

        const pregameRoomMembers = await this.pregameRoomsService.findRoomMembers({
            roomId: newPregameRoom.id
        })

        this.server.emit('pregame', {
            event: 'create',
            newPregameRoom,
            roomMembers: pregameRoomMembers
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave')
    async leaveRoom(@ConnectedSocket() socket: SocketWithSession) {
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
    async joinRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: JoinRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const joinedUserData = await this.pregameRoomsService.joinUserToRoom({
            userId: userId,
            roomId: dto.roomId
        })

        this.server.emit('pregame',
            {
                event: 'join',
                pregameRoom: joinedUserData.pregameRoom,
                joinedUser: joinedUserData.joinedUser
            }
        )
    }
}