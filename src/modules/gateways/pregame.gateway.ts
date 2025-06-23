import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { Server } from "socket.io";
import { forwardRef, Inject, UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { MessagesService } from "../messages/messages.service";
import { ErrorTypes, WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { UsersService } from "../users/users.service";
import { throwException } from "./common/throw-ws-exception";
import { JoinRoomDto } from "./dto/pregame/join-room.dto";
import { KickFromRoomDto } from "./dto/pregame/kick-from-room.dto";
import { GetRoomsPageDto } from "./dto/pregame/get-rooms-page.dto";
import { RemoveSocketFromRoomDto } from "./dto/pregame/remove-socket-from-room.dto";
import { ReportRoomRemovedDto } from "./dto/pregame/report-room-removed";
import { ExceptionData } from "./types/exception-data.type";

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
        const exctractedUserId = socket.request.session.userId
        if (!exctractedUserId) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `UserId doesn't extracted.`
            })
        }
        return exctractedUserId
    }

    async removeSocketFromRoom(dto: RemoveSocketFromRoomDto): Promise<boolean> {
        const allSockets = await this.server.fetchSockets()
        const socket = allSockets.find(socket => socket.data.userId === dto.userId)
        if (!socket) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `Socket not found.`
            })
        }

        socket.leave(dto.roomId)
        return true
    }

    async reportRoomRemoved(dto: ReportRoomRemovedDto): Promise<void> {
        this.server.emit('pregame', {
            event: 'remove room',
            deletedRoomId: dto.roomId,
            message: `Room was remowed.`
        })
    }

    async reportRoomOwner(room_id: string): Promise<boolean | ExceptionData> {
        const foundRoom = await this.pregameRoomsService.findRoomById(room_id)
        if(!foundRoom) {
            return {
                errorType: ErrorTypes.NotFound,
                message: `Room not found.`
            }
        }

        this.server.to(room_id).emit('pregame', {
            event: 'event',
            roomOwnerId: foundRoom.ownerId,
            message: `User ${foundRoom.ownerId} is owner of this room.`
        })

        return true
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) {
            throwException(socket, 'Unauthorized.')
            return
        }

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if (!foundRoom) {
            return
        }
        socket.join(foundRoom.id)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('rooms-page')
    @UsePipes(new ValidationPipe)
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetRoomsPageDto
    ) {
        const roomsPage = await this.pregameRoomsService.getRoomsPage({
            pageSize: dto.pageSize ? dto.pageSize : 12,
            pageNumber: dto.pageNumber
        })

        socket.emit('pregame', roomsPage)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const exctractedUserId = this.extractUserId(socket)

        const foundUser = await this.usersService.findUserById(exctractedUserId)
        if (foundUser?.pregameRoomId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User is already in the room.`
            })
        }

        const newPregameRoom = await this.pregameRoomsService.createRoom({ userId: exctractedUserId })
        if ('errorType' in newPregameRoom) {
            throw new WsException({
                errorType: newPregameRoom.errorType,
                message: newPregameRoom.message
            })
        }

        const pregameRoom = newPregameRoom
        socket.join(pregameRoom.id)
        this.server.emit('pregame', {
            event: 'create_room',
            createdRoom: pregameRoom,
            message: `Created new pregame room.`
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
        if (!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: 'User not found.'
            })
        }
        if ('errorType' in pregameRoom) {
            throw new WsException({
                errorType: pregameRoom.errorType,
                message: pregameRoom.message
            })
        }

        socket.join(pregameRoom.id)
        this.server.to(pregameRoom.id).emit('pregame', {
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
        if (!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: 'User not found.'
            })
        }
        if (!foundUser.pregameRoomId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in the pregame room.`
            })
        }

        const foundRoom = await this.pregameRoomsService.findRoomById(foundUser.pregameRoomId)
        if (!foundRoom) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `Room not found.`
            })
        }

        const leaveResult = await this.pregameRoomsService.leaveRoom({
            userId,
            roomId: foundRoom.id
        })
        if (typeof leaveResult !== 'boolean') {
            throw new WsException({
                errorType: leaveResult.errorType,
                message: leaveResult.message
            })
        }

        socket.leave(foundRoom.id)
        this.server.emit('pregame', {
            event: 'leave',
            leftUser: foundUser,
            message: `${foundUser.name} left the room.`
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('kick')
    async kickFromRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: KickFromRoomDto
    ) {
        const userId = this.extractUserId(socket)

        if (userId === dto.userId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `You're can't kick yourself.`
            })
        }

        const [foundRoom, foundUser] = await Promise.all([
            this.pregameRoomsService.findRoomByUserId(userId),
            this.usersService.findUserById(dto.userId)
        ])

        if (!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: `Kicked not found.`
            })
        }
        if (foundRoom?.ownerId !== userId) {
            throw new WsException({
                errorType: ErrorTypes.Forbidden,
                message: `Not enough rights to kicking users from this room.`
            })
        }
        if (foundUser.pregameRoomId !== foundRoom.id) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in this pregame room.`
            })
        }

        const isKicked = await this.pregameRoomsService.kickFromRoom({
            userId: dto.userId,
            roomId: foundRoom.id
        })
        if (!isKicked) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: 'Failed to delete records from database.'
            })
        }

        this.server.to(foundRoom.id).emit('pregame', {
            event: 'kick',
            kickedUser: foundUser,
            message: `${foundUser.name} was kicked from the room.`
        })

        this.server.except(foundRoom.id).emit('pregame', {
            event: 'leave',
            leftUser: foundUser,
            message: `${foundUser.name} left the room.`
        })

        await this.removeSocketFromRoom({
            userId: dto.userId,
            roomId: foundRoom.id
        })
    }
}