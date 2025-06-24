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
import { EmitNewOwnerDto } from "./dto/pregame/emit-new-room-owner.dto";
import { SendMessageDto } from "./dto/pregame/send-message.dto";
import { GetMessagesPageDto } from "./dto/pregame/get-messages-page.dto";
import { ChatMembersService } from "../chat-members/chat-members.service";
import { User } from "src/models/user.model";

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
        private readonly usersService: UsersService,
        private readonly chatMembersService: ChatMembersService
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
        const [allSockets, foundRoom] = await Promise.all([
            this.server.fetchSockets(),
            this.pregameRoomsService.findRoomById(dto.roomId)
        ])
        if(!foundRoom) return false

        const socket = allSockets.find(socket => socket.data.userId === dto.userId)
        if (!socket) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `Socket not found.`
            })
        }

        socket.leave(foundRoom.chatId)
        socket.leave(foundRoom.id)
        return true
    }

    async reportRoomRemoved(dto: ReportRoomRemovedDto): Promise<boolean> {
        const foundRoom = await this.pregameRoomsService.findRoomById(dto.roomId)
        if(!foundRoom) return false

        this.server.emit('pregame', {
            event: 'remove',
            removedRoom: {
                id: foundRoom.id,
                ownerId: foundRoom.ownerId
            },
        })
        return true
    }

    async emitNewRoomOwner(dto: EmitNewOwnerDto): Promise<boolean | ExceptionData> {
        const foundRoom = await this.pregameRoomsService.findRoomById(dto.roomId)
        if(!foundRoom) {
            return {
                errorType: ErrorTypes.NotFound,
                message: `Room not found.`
            }
        }

        const foundUser = await this.usersService.findUserById(foundRoom.ownerId)
        if (!foundUser) {
            return {
                errorType: ErrorTypes.NotFound,
                message: `User not found.`
            }
        }

        this.server.to(foundRoom.id).emit('pregame', {
            event: 'new-owner',
            pregameRoom: {
                id: foundRoom.id,
                ownerId: foundRoom.ownerId
            },
            newRoomOwner: {
                id: foundUser.id,
                email: foundUser.email,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            },
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
        socket.join(foundRoom.chatId)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('rooms-page')
    @UsePipes(new ValidationPipe)
    async getRoomsPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetRoomsPageDto
    ) {
        const foundRooms = await this.pregameRoomsService.getRoomsPage({
            pageSize: dto.pageSize ? dto.pageSize : 12,
            pageNumber: dto.pageNumber ? dto.pageNumber : 1
        })

        const roomsPage = await Promise.all(foundRooms.roomsPage.map(
            async pregameRoom => {
                const roomMembers = await this.usersService.findPregameRoomUsers({
                    roomId: pregameRoom.id
                })
                return {
                    pregameRoom: {
                        id: pregameRoom.id,
                        ownerId: pregameRoom.ownerId
                    },
                    roomMembers: roomMembers.map(user => ({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        role: user.role
                    }))
                }
            }
        ))

        socket.emit('pregame', {
            event: 'rooms-page',
            roomsPage: roomsPage,
            totalCount: foundRooms.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('messages-page')
    async getMessagesPage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: GetMessagesPageDto
    ) {
        const userId = this.extractUserId(socket)

        const foundRoom = await this.pregameRoomsService.findRoomByUserId(userId)
        if(!foundRoom) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in the pregame room.`
            })
        }

        const [foundMessages, foundChatMembers] = await Promise.all([
            this.messagesService.getMessagesPage({
                chatId: foundRoom.chatId,
                pageNumber: dto.pageNumber ? dto.pageNumber : 1,
                pageSize: dto.pageSize ? dto.pageSize : 24
            }),
            this.chatMembersService.findChatMembers({
                chatId: foundRoom.chatId
            })
        ])

        const messagesPage = await Promise.all(foundMessages.messagesPage.map(
            async message => {
                const chatMember = foundChatMembers.find(member => member.userId === message.userId)

                if (chatMember) {
                    const foundUser = await this.usersService.findUserById(chatMember.userId)

                    return {
                        message: {
                            message: message.id,
                            messageText: message.text,
                            createdAt: message.createdAt
                        },
                        sender: {
                            id: foundUser?.id,
                            email: foundUser?.email,
                            name: foundUser?.name,
                            avatarUrl: foundUser?.avatarUrl,
                            role: foundUser?.role
                        }
                    }
                }

                const leftSender = await this.usersService.findUserById(message.userId)

                return {
                    message: {
                        message: message.id,
                        messageText: message.text,
                        createdAt: message.createdAt
                    },
                    sender: {
                        id: leftSender?.id,
                        email: leftSender?.email,
                        name: leftSender?.name,
                        avatarUrl: leftSender?.avatarUrl,
                        role: leftSender?.role
                    }
                }
            }
        ))

        socket.emit('chat', {
            event: 'messages-page',
            messagesPage: messagesPage,
            totalCount: foundMessages.totalCount
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('create')
    async createPregameRoom(
        @ConnectedSocket() socket: SocketWithSession
    ) {
        const userId = this.extractUserId(socket)

        const foundUser = await this.usersService.findUserById(userId)
        if (!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: `User not found.`
            })
        }
        if (foundUser.pregameRoomId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User is already in the room.`
            })
        }

        const newPregameRoom = await this.pregameRoomsService.createRoom({ userId: foundUser.id })
        if ('errorType' in newPregameRoom) {
            throw new WsException({
                errorType: newPregameRoom.errorType,
                message: newPregameRoom.message
            })
        }

        socket.join(newPregameRoom.id)
        socket.join(newPregameRoom.chatId)

        this.server.emit('pregame', {
            event: 'create',
            createdRoom: {
                id: newPregameRoom.id,
                ownerId: newPregameRoom.ownerId
            },
            roomMembers: [{
                id: foundUser.id,
                email: foundUser.email,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            }]
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join')
    async joinRoom(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: JoinRoomDto
    ) {
        const userId = this.extractUserId(socket)

        const foundUser = await this.usersService.findUserById(userId)
        if (!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: 'User not found.'
            })
        }
        if(foundUser.pregameRoomId) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: 'User in room already.'
            })
        }

        const pregameRoom = await this.pregameRoomsService.joinRoom({
            userId: userId,
            roomId: dto.roomId
        })
        if ('errorType' in pregameRoom) {
            throw new WsException({
                errorType: pregameRoom.errorType,
                message: pregameRoom.message
            })
        }

        socket.join(pregameRoom.id)
        socket.join(pregameRoom.chatId)

        this.server.to(pregameRoom.id).emit('pregame', {
            event: 'join',
            joinedUser: {
                id: foundUser.id,
                email: foundUser.email,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            },
            joinTo: {
                id: pregameRoom.id,
                ownerId: pregameRoom.ownerId
            }
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
        socket.leave(foundRoom.chatId)

        this.server.emit('pregame', {
            event: 'leave',
            leftUser: {
                id: foundUser.id,
                email: foundUser.id,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            },
            leftFrom: {
                id: foundRoom.id,
                ownerId: foundRoom.ownerId 
            }
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
            kickedUser: {
                id: foundUser.id,
                email: foundUser.id,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            },
            leftFrom: {
                id: foundRoom.id,
                ownerId: foundRoom.ownerId 
            }
        })

        this.server.except(foundRoom.id).emit('pregame', {
            event: 'leave',
            leftUser: {
                id: foundUser.id,
                email: foundUser.id,
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                role: foundUser.role
            },
            leftFrom: {
                id: foundRoom.id,
                ownerId: foundRoom.ownerId 
            }
        })

        await this.removeSocketFromRoom({
            userId: dto.userId,
            roomId: foundRoom.id
        })
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send')
    async sendMessage(
        @ConnectedSocket() socket: SocketWithSession,
        @MessageBody() dto: SendMessageDto
    ) {
        const userId = this.extractUserId(socket)

        if(!dto.messageText) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `Message can't be empty.`
            })
        }

        const [foundUser, foundRoom] = await Promise.all([
            this.usersService.findUserById(userId),
            this.pregameRoomsService.findRoomByUserId(userId)
        ])
        if(!foundUser) {
            throw new WsException({
                errorType: ErrorTypes.NotFound,
                message: `User not found.`
            })
        }
        if(!foundRoom) {
            throw new WsException({
                errorType: ErrorTypes.BadRequest,
                message: `User isn't in the pregame room.`
            })
        }

        const newMessage = await this.messagesService.createMessage({
            userId: userId,
            chatId: foundRoom.chatId,
            messageText: dto.messageText
        })
        if(!newMessage) {
            throw new WsException({
                errorType: ErrorTypes.Internal,
                message: `Message wasn't sent.`
            })
        }

        this.server.to(foundRoom.chatId).emit('chat',{
            event: 'send',
            message: {
                id: newMessage.id,
                messageText: newMessage.text,
                createdAt: newMessage.createdAt,
                sender: {
                    id: foundUser.id,
                    email: foundUser.email,
                    name: foundUser.name,
                    avatarUrl: foundUser.avatarUrl,
                    role: foundUser.role
                }
            }
        })
    }
}