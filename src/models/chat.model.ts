import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { PregameRoom } from "./pregame-room.model";
import { Message } from "./message.model";
import { ChatMember } from "./chat-members";

export enum TiedTo {
    GLOBAL = 'GLOBAL',
    GAME = 'GAME',
    PREGAME = 'PREGAME',
    PRIVATE = 'PRIVATE'
}

@Table({ tableName: 'Chats' })
export class Chat extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(TiedTo)),
        allowNull: true,
    })
    declare tiedTo: TiedTo

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare pregameRoomId: string

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare gameId: string

    @HasMany(() => Message)
    messages: Message[]

    @HasMany(() => ChatMember)
    chatMembers: ChatMember[]
}