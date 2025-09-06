import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { DefaultEventsMap, RemoteSocket, Server } from "socket.io";
import { InternalServerErrorException, UseFilters, UseGuards, ValidationPipe } from "@nestjs/common";
import { PregameRoomMember } from "src/models/pregame-room-member.model";
import { User } from "src/models/user.model";
import { Message } from "src/models/message.model";
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
import { PregameRoom } from "src/models/pregame-room.model";

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
        private readonly pregameRoomsFormatterService: PregameRoomsFormatterService
    ) { }

    @WebSocketServer()
    server: Server

    private extractUserId(socket: SocketWithSession): string {
        const userId = socket.request.session.userId
        if (!userId) throw new InternalServerErrorException(`Failed to extract userId.`)
        return userId
    }

    private async findSocketById(id: string): Promise<RemoteSocket<DefaultEventsMap, any> | undefined> {
        const allSockets = await this.server.fetchSockets()
        return allSockets.find(socket => socket.data.userId === id)
    }

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
        this.server.emit('remove-pregame-room', {
            pregameRoom: this.pregameRoomsFormatterService.formatCompressedPregameRoom(pregameRoom)
        })
    }

    async handleConnection(socket: SocketWithSession): Promise<void> {
        const userId = socket.request.session.userId
        if (!userId) return

        const pregameRoomMember = await this.pregameRoomMembersService.findOneByUserId(userId)
        if (!pregameRoomMember) return

        socket.join(pregameRoomMember.pregameRoomId)
    }

    @SubscribeMessage('pregame-rooms-page')
    private async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetPregameRoomsPageDto
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
                        return this.pregameRoomsFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, member)
                    })
                )

                return this.pregameRoomsFormatterService.formatPregameRoom(pregameRoom, formattedPregameRoomMembers, availableChips)
            })
        )

        socket.emit('pregame-rooms-page', {
            pregameRoomsList: foramttedPregameRooms,
            totalCount: pregameRoomsPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('pregame-room-messages-page')
    private async getPregameRoomChatMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: GetPregameRoomMessagesPageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const options = {
            pageNumber: dto.pageNumber ? dto.pageNumber : 1,
            pageSize: dto.pageSize ? dto.pageSize : 12
        }

        const pregameRoomChatMessagesPage = await this.pregameRoomsService.getPregameRoomChatMessagesPage(userId, options.pageNumber, options.pageSize)

        const formattedPregameRoomMessages = await Promise.all(
            pregameRoomChatMessagesPage.messagesList.reverse().map(async (message: Message) => {
                const user = message.userId
                    ? await this.usersService.findOne(message.userId)
                    : null
                return this.pregameRoomsFormatterService.formatPregameRoomChatMessage(message, user)
            })
        )

        socket.emit('pregame-room-messages-page', {
            messagesList: formattedPregameRoomMessages,
            totalCount: pregameRoomChatMessagesPage.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create-pregame-room')
    private async createPregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
        const userId = this.extractUserId(socket)

        const initPregameRoom = await this.pregameRoomsService.initPregameRoom(userId)
        socket.join(initPregameRoom.pregameRoom.id)

        const [pregameRoomMemberAsUser, availableChips] = await Promise.all([
            this.usersService.getOneOrThrow(initPregameRoom.pregameRoomMember.userId),
            this.pregameRoomsService.getAvailableChips(initPregameRoom.pregameRoom.id)
        ])

        const formattedPregameRoomMembers = [this.pregameRoomsFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, initPregameRoom.pregameRoomMember)]

        this.server.emit('create-pregame-room', {
            pregameRoom: this.pregameRoomsFormatterService.formatPregameRoom(initPregameRoom.pregameRoom, formattedPregameRoomMembers, availableChips)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave-pregame-room')
    private async leavePregameRoom(@ConnectedSocket() socket: SocketWithSession): Promise<void> {
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
            await this.chatsService.destroy(pregameRoom.chatId)
            await this.pregameRoomsService.destroy(pregameRoom.id)

            this.server.emit('remove-pregame-room', {
                pregameRoom: this.pregameRoomsFormatterService.formatCompressedPregameRoom(pregameRoom)
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
            this.pregameRoomsFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember)
        ))

        this.server.emit('leave-pregame-room', {
            pregameRoom: this.pregameRoomsFormatterService.formatPregameRoom(pregameRoom, formattedPregameRoomMembers, availableChips),
            leftMember: this.pregameRoomsFormatterService.formatPregameRoomMember(pregameRoomMemberAsUser, removedPregameRoomMember)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join-pregame-room')
    private async joinPregameRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: JoinPregameRoomDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const newPregameRoomMember = await this.pregameRoomsService.addMember(userId, dto.pregameRoomId, dto.slot)
        socket.join(newPregameRoomMember.pregameRoomId)

        const [currentPregameRoomMembers, pregameRoom, user] = await Promise.all([
            this.pregameRoomMembersService.findAllByPregameRoomId(dto.pregameRoomId),
            this.pregameRoomsService.getOneOrThrow(dto.pregameRoomId),
            this.usersService.getOneOrThrow(userId)
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
            (this.pregameRoomsFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember))
        )

        this.server.emit('join-pregame-room', {
            pregameRoom: this.pregameRoomsFormatterService.formatPregameRoom(pregameRoom, formattedMembers, availableChips),
            joinedMember: this.pregameRoomsFormatterService.formatPregameRoomMember(user, newPregameRoomMember)
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send-pregame-room-message')
    private async sendPregameRoomMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SendPregameRoomMessageDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const sendPregameRoomMessage = await this.pregameRoomsService.sendPregameRoomMessage(userId, dto.messageText)

        this.server.to(sendPregameRoomMessage.pregameRoomId).emit('send-pregame-room-message', {
            message: this.pregameRoomsFormatterService.formatPregameRoomChatMessage(sendPregameRoomMessage.message, sendPregameRoomMessage.user),
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('set-pregame-room-member-slot')
    private async setPregameRoomMemberSlot(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody(new ValidationPipe()) dto: SetPeregameRoomMemberSlotDto
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
            this.pregameRoomsFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember)
        )

        this.server.emit('set-pregame-room-member-slot', {
            pregameRoom: this.pregameRoomsFormatterService.formatPregameRoom(
                setPregameRoomMemberSlot.pregameRoom,
                formattedPregameRoomMembers,
                availableChips
            )
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('set-pregame-room-player-chip')
    private async setPregameRoomPlayerChip(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: SetPregameRoomMemberPlayerChipDto
    ): Promise<void> {
        const userId = this.extractUserId(socket)

        const updatedPregameRoomMember = await this.pregameRoomsService.setPregameRoomMemberPlayerChip(userId, dto.playerChip)

        const [pregameRoomMembers, pregameRoom, availableChips] = await Promise.all([
            this.pregameRoomMembersService.findAllByPregameRoomId(updatedPregameRoomMember.pregameRoomId),
            this.pregameRoomsService.getOneOrThrow(updatedPregameRoomMember.pregameRoomId),
            this.pregameRoomsService.getAvailableChips(updatedPregameRoomMember.pregameRoomId)
        ])

        const pregameRoomMembersWithUsers = await Promise.all(
            pregameRoomMembers.map(async (member: PregameRoomMember) => {
                const pregameRoomMemberAsUser = await this.usersService.findOne(member.userId)
                return {
                    user: pregameRoomMemberAsUser ? pregameRoomMemberAsUser : null,
                    pregameRoomMember: member
                }
            })
        )

        const formattedPregameRoomMembers = pregameRoomMembersWithUsers.map(memberWithUser =>
            this.pregameRoomsFormatterService.formatPregameRoomMember(memberWithUser.user, memberWithUser.pregameRoomMember)
        )

        this.server.emit('set-pregame-room-player-chip', {
            pregameRoom: this.pregameRoomsFormatterService.formatPregameRoom(
                pregameRoom,
                formattedPregameRoomMembers,
                availableChips
            )
        })
    }
}