import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { BadRequestException, InternalServerErrorException, NotFoundException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { convertPregameRoomMember } from "./converters/pregameRoomMember";
import { JoinPregameRoomDto } from "./dto/pregame/join-pregame-room.dto";
import { convertCommonPregameRoom, convertPregameRoomWithMembers } from "./converters/pregameRoom";
import { GetRoomsPageDto } from "./dto/pregame/get-rooms-page.dto";

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
        const [pregameRoomsPage, pregameRoomsCount] = await Promise.all([
            this.pregameRoomsService.getPregameRoomsPage(dto.pageNumber, dto.pageSize),
            this.pregameRoomsService.getPregameRoomsCount()
        ])

        const convertedPregameRooms = await Promise.all(
            pregameRoomsPage.map(async (pregameRoom) => {
                const pregameRoomMembers = await this.pregameRoomsService.getPregameRoomMembers(pregameRoom.id)
                return await convertPregameRoomWithMembers(pregameRoom, pregameRoomMembers)
            })
        )

        socket.emit('pregame', {
            event: 'rooms-page',
            pregameRoomsPage: convertedPregameRooms,
            totalCount: pregameRoomsCount
        })
    }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('messages-page')
    // async getMessagesPage(
    //     @ConnectedSocket() socket: SocketWithSession,
    //     @MessageBody(new ValidationPipe()) dto: GetMessagesPageDto
    // ) {
    //     const userId = this.extractUserId(socket)
    // }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async create(@ConnectedSocket() socket: SocketWithSession) {
        const userId = this.extractUserId(socket)

        const receivedUser = await this.usersService.getOrThrow(userId)
        if (receivedUser.pregameRoomId || receivedUser.gameId) throw new BadRequestException(`Failed to create new pregame room. User in the pregame room or game already.`)

        const newPregameRoom = await this.pregameRoomsService.initPregameRoom(userId)

        this.server.emit('pregame', {
            event: 'create',
            newPregameRoom: {
                id: newPregameRoom.id,
                members: [convertPregameRoomMember(receivedUser, newPregameRoom)],
                createdAt: newPregameRoom.createdAt
            }
        })
    }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('leave')
    // async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession) {
    //     const userId = this.extractUserId(socket)

        
    // }

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
        
        this.server.emit('pregame', {
            event: 'join',
            pregameRoom: convertCommonPregameRoom(pregameRoom),
            joinedUser: convertPregameRoomMember(user, pregameRoom)
        })
    }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('kick')
    // async kickUserFromPregameRoom(
    //     @ConnectedSocket() socket: SocketWithSession,
    //     @MessageBody(new ValidationPipe()) dto: KickUserFromPregameRoomDto
    // ) {
    //     const userId = this.extractUserId(socket)

        
    // }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('send')
    // async sendMessage(
    //     @ConnectedSocket() socket: SocketWithSession,
    //     @MessageBody(new ValidationPipe()) dto: SendMessageDto
    // ) {
    //     const userId = this.extractUserId(socket)

        
    // }
}