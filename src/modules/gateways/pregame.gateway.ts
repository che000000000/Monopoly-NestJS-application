import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards } from "@nestjs/common";
import { ErrorTypes, WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { throwException } from "./common/throw-ws-exception";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { EmitRemoveRoomDto } from "./dto/pregame/emit-remove-room.dto";
import { EmitNewOwnerDto } from "./dto/pregame/emit-new-owner.dto";

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
        @Inject(forwardRef(() => PregameRoomsService))private readonly pregameRoomsService: PregameRoomsService,
        private readonly usersService: UsersService
    ) { }
    @WebSocketServer()
    server: Server

    emitRemoveRoom(dto: EmitRemoveRoomDto): void {
        this.server.emit('pregame', {
            event: 'remove',
            pregameRoom: {
                id: dto.pregameRoom.id,
                createdAt: dto.pregameRoom.createdAt
            }
        })
    }

    emitNewOwner(dto: EmitNewOwnerDto): void {
        this.server.emit('pregame', {
            event: 'new-owner',
            newOwner: {
                id: dto.newOwner.id,
                name: dto.newOwner.name,
                avatarUrl: dto.newOwner.avatarUrl,
                role: dto.newOwner.role
            },
            pregameRoom: {
                id: dto.pregameRoom.id,
                createdAt: dto.pregameRoom.createdAt
            }
        })
    }

    extractUserId(socket: SocketWithSession): string {
        const exctractedUserId = socket.request.session.userId
        if (!exctractedUserId) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `Failed to extract userId.`
            })
        }
        return exctractedUserId
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) {
            throwException(socket, {
                errorType: ErrorTypes.Internal,
                message: `Failed to extract userId.`,
                from: `PregameGateway`
            })
            socket.disconnect()
            return
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) return

        socket.join(foundRoom.id)
        socket.join(foundRoom.chatId)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const isUserInTheRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (isUserInTheRoom) throw new WsException({
            errorType: ErrorTypes.BadRequest,
            message: `User is already in the room`,
            from: `PregameGateway`
        })

        const newPregameRoom = await this.pregameRoomsService.initRoom({
            userId: userId
        })
        if ('errorType' in newPregameRoom) throw new WsException({
            errorType: newPregameRoom.errorType,
            message: newPregameRoom.message,
            from: newPregameRoom.from
        })

        const pregameRoomMembers = await this.pregameRoomsService.findRoomMembers({
            roomId: newPregameRoom.id
        })
        if ('errorType' in pregameRoomMembers) throw new WsException({
            errorType: pregameRoomMembers.errorType,
            message: pregameRoomMembers.message,
            from: pregameRoomMembers.from
        })
          
        this.server.emit('pregame', {
            event: 'create',
            newPregameRoom,
            roomMembers: pregameRoomMembers
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave')
    async leaveRoom(
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const userId = this.extractUserId(socket)

        const leftUser = await this.pregameRoomsService.removeFromRoom({
            userId: userId
        })
        if('errorType' in leftUser) throw new WsException({
            errorType: leftUser.errorType,
            message: leftUser.message,
            from: leftUser.from
        })

        this.server.emit('pregame', {
            event: 'left',
            leftUser: leftUser
        })
    }
}