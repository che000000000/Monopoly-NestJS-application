import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";
import { InternalServerErrorException, UnauthorizedException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { WsExceptionsFilter } from "./filters/WsExcepton.filter";
import { PregameRoomsService } from "../pregame-rooms/pregame-rooms.service";
import { SocketWithSession } from "./interfaces/socket-with-session.interface";
import { WsAuthGuard } from "./guards/wsAuth.guard";
import { UsersService } from "../users/users.service";
import { JoinPregameRoomDto } from "./dto/pregame/join-pregame-room.dto";
import { GetRoomsPageDto } from "./dto/pregame/get-rooms-page.dto";
import { KickFromRoomDto } from "./dto/pregame/kick-from-room.dto";
import { SendMessageDto } from "./dto/pregame/send-message.dto";
import { GetMessagesPageDto } from "./dto/pregame/get-messages-page.dto";
import { PregameRoomMembersService } from "../pregame-room-members/pregame-room-members.service";
import { DataFormatterService } from "../data-formatter/data-formatter.service";
import { PregameRoomMember } from "src/models/pregame-room-member.model";
import { SetPeregameRoomSlotDto } from "./dto/pregame/set-pregame-room-slot.dto";
import { User } from "src/models/user.model";
import { MessagesService } from "../messages/messages.service";
import { Message } from "src/models/message.model";

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
    namespace: 'pregame-rooms',
    cors: {
        origin: true,
        credentials: true
    }
})
export class PregameRoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly pregameRoomsService: PregameRoomsService,
        private readonly pregameRoomMembersService: PregameRoomMembersService,
        private readonly usersService: UsersService,
        private readonly dataFormatterService: DataFormatterService
    ) { }

    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) throw new InternalServerErrorException(`Failed to extract userId.`)
        return userId
    }

    // private async findSocketById(user_id: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
    //     const allSockets = await this.server.fetchSockets()
    //     return allSockets.find(socket => socket.data.userId === user_id)
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

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) return

        socket.join(pregameRoomMember.pregameRoomId)
    }

    async handleDisconnect(socket: SocketWithSession) {
        const allSocketRooms = Array.from(socket.rooms).filter(room => room !== socket.id)
        allSocketRooms.forEach(room => socket.leave(room))
    }

    // async removePregameRoom(pregameRoom: PregameRoom): Promise<void> {
    //     if (!pregameRoom) throw new InternalServerErrorException(`Failed to remove pregame room. Pregame room not defined.`)

    //     this.pregameRoomsService.removePregameRoom(pregameRoom)

    //     const pregameRoomUsers = await this.usersService.findPregameRoomUsers(pregameRoom.id)
    //     await this.removeSocketsFromRooms(pregameRoomUsers)
    // }

    @SubscribeMessage('pregame-rooms-page')
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetRoomsPageDto
    ): Promise<void> {
        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 8
        }
        const pregameRoomsPage = await this.pregameRoomsService.getPage(options.pageNumber, options.pageSize)

        const foramttedPregameRooms = await Promise.all(
            pregameRoomsPage.pregameRooms.map(async (pregameRoom) => {
                const [pregameRoomMembers, availableChips] = await Promise.all([
                    this.pregameRoomMembersService.findAllByPregameRoomId(pregameRoom.id),
                    this.pregameRoomsService.getAvailableChips(pregameRoom.id)
                ])

                const formattedPregameRoomMembers = await Promise.all(
                    pregameRoomMembers.map(async (member: PregameRoomMember) => {
                        const pregameRoomMemberAsUser = await this.usersService.findOne(member.userId)
                        return this.dataFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, member)
                    })
                )

                return this.dataFormatterService.formatPregameRoom(pregameRoom, formattedPregameRoomMembers, availableChips)
            })
        )

        socket.emit('pregame-rooms-page', {
            pregameRoomsList: foramttedPregameRooms,
            totalCount: pregameRoomsPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pregame-room-messages-page')
    async getPregameRoomMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetMessagesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 12
        }

        const messagesPage = await this.pregameRoomsService.getMessagesPage(userId, options.pageNumber, options.pageSize)

        const messagesWithSendersAsUsers = await Promise.all(
            messagesPage.messages.reverse().map(async (message: Message) => {
                const messageSenderAsUser = await this.usersService.findOne(message.userId)
                return {
                    message,
                    user: messageSenderAsUser
                }
            })
        )

        socket.emit('pregame-room-messages-page', {
            messages: messagesWithSendersAsUsers.map((messageWithSenderAsUser: {message: Message, user: User}) => this.dataFormatterService.formatPregameRoomMessage(
                messageWithSenderAsUser.message,
                messageWithSenderAsUser.user
            )),
            totalCount: messagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create-pregame-room')
    async createPregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const initPregameRoom = await this.pregameRoomsService.init(userId)
        socket.join(initPregameRoom.pregameRoom.id)

        const [pregameRoomMemberAsUser, availableChips] = await Promise.all([
            this.usersService.getOrThrow(initPregameRoom.pregameRoomMember.userId),
            this.pregameRoomsService.getAvailableChips(initPregameRoom.pregameRoom.id)
        ])

        const formattedPregameRoomMembers = [this.dataFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, initPregameRoom.pregameRoomMember)]

        this.server.emit('create-pregame-room', {
            pregameRoom: this.dataFormatterService.formatPregameRoom(initPregameRoom.pregameRoom, formattedPregameRoomMembers, availableChips)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave-pregame-room')
    async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const [removedPregameRoomMember, pregameRoomMemberAsUser] = await Promise.all([
            this.pregameRoomsService.removePregameRoomMember(userId),
            this.usersService.findOne(userId)
        ])
        socket.leave(removedPregameRoomMember.pregameRoomId)

        const [pregameRoom, currentPregameRoomMembers] = await Promise.all([
            this.pregameRoomsService.getOneOrThrow(removedPregameRoomMember.pregameRoomId),
            this.pregameRoomMembersService.findAllByPregameRoomId(removedPregameRoomMember.pregameRoomId)
        ])

        if (currentPregameRoomMembers.length === 0) {
            await this.pregameRoomsService.removePregameRoom(pregameRoom.id)

            this.server.emit('remove-pregame-room', {
                pregameRoom: this.dataFormatterService.formatCompressedPregameRoom(pregameRoom)
            })
            return
        }

        const [pregameRoomMembersWithUsers, availableChips] = await Promise.all([
            Promise.all(
                currentPregameRoomMembers.map(async (member: PregameRoomMember) => {
                    const pregameRoomMemberAsUser = await this.usersService.findOne(member.userId);
                    return {
                        user: pregameRoomMemberAsUser ? pregameRoomMemberAsUser : null,
                        pregameRoomMember: member
                    }
                })
            ),
            this.pregameRoomsService.getAvailableChips(pregameRoom.id)
        ])

        const formattedPregameRoomMembers = pregameRoomMembersWithUsers.map(memberWithUser => (
            this.dataFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember)
        ))

        this.server.emit('leave-pregame-room', {
            pregameRoom: this.dataFormatterService.formatPregameRoom(pregameRoom, formattedPregameRoomMembers, availableChips),
            leftMember: this.dataFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, removedPregameRoomMember)
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

        const [currentPregameRoomMembers, pregameRoom, user] = await Promise.all([
            this.pregameRoomMembersService.findAllByPregameRoomId(dto.pregameRoomId),
            this.pregameRoomsService.getOneOrThrow(dto.pregameRoomId),
            this.usersService.getOrThrow(userId)
        ])

        const [pregameRoomMembersWithUsers, availableChips] = await Promise.all([
            await Promise.all(
                currentPregameRoomMembers.map(async (member: PregameRoomMember) => {
                    const pregameRoomMemberAsUser = await this.usersService.findOne(member.userId)
                    return {
                        user: pregameRoomMemberAsUser ? pregameRoomMemberAsUser : null,
                        pregameRoomMember: member
                    }
                })
            ),
            this.pregameRoomsService.getAvailableChips(pregameRoom.id)
        ])

        const formattedMembers = pregameRoomMembersWithUsers.map(memberWithUser =>
            (this.dataFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember))
        )

        this.server.emit('join-pregame-room', {
            pregameRoom: this.dataFormatterService.formatPregameRoom(pregameRoom, formattedMembers, availableChips),
            joinedMember: this.dataFormatterService.formatPregameRoomMember(user, newPregameRoomMember)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-pregame-room-message')
    async sendMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendPregameRoomMessage = await this.pregameRoomsService.sendPregameRoomMessage(userId, dto.messageText)

        this.server.to(sendPregameRoomMessage.pregameRoomId).emit('send-pregame-room-message', {
            message: this.dataFormatterService.formatPregameRoomMessage(sendPregameRoomMessage.message, sendPregameRoomMessage.user),
            totalCount: sendPregameRoomMessage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('set-pregame-room-member-slot')
    async setPregameRoomMemberSlot(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SetPeregameRoomSlotDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const setPregameRoomMemberSlot = await this.pregameRoomsService.setPregameRoomMemberSlot(userId, dto.slot)

        const [pregameRoomMembersWithUsers, availableChips] = await Promise.all([
            await Promise.all(
                setPregameRoomMemberSlot.pregameRoomMembers.map(async (member: PregameRoomMember) => {
                    const pregameRoomMemberAsUser = await this.usersService.findOne(member.userId)
                    return {
                        user: pregameRoomMemberAsUser ? pregameRoomMemberAsUser : null,
                        pregameRoomMember: member
                    }
                })
            ),
            this.pregameRoomsService.getAvailableChips(setPregameRoomMemberSlot.pregameRoom.id)
        ])

        const formattedPregameRoomMembers = pregameRoomMembersWithUsers.map((memberWithUser) =>
            this.dataFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember)
        )

        this.server.emit('set-pregame-room-member-slot', {
            pregameRoom: this.dataFormatterService.formatPregameRoom(
                setPregameRoomMemberSlot.pregameRoom,
                formattedPregameRoomMembers,
                availableChips
            )
        })
    }
}