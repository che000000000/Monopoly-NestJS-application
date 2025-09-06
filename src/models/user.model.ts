import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Account } from "./account.model";
import { ChatMember } from "./chat-members";
import { Message } from "./message.model";
import { Player } from "./player.model";
import { PregameRoomMember } from "./pregame-room-member.model";

export enum UserRole {
    REGULAR = 'REGULAR',
    ADMIN = 'ADMIN',
    DEV = 'DEV'
}

export enum AuthMethod {
    CREDENTIALS = 'CREDENTIALS',
    GOOGLE = 'GOOGLE'
}

@Table({ tableName: 'Users' })
export class User extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare email: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    declare password: string | null

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    declare avatarUrl: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.REGULAR
    })
    declare role: UserRole

    @Column({
        type: DataType.ENUM(...Object.values(AuthMethod)),
        allowNull: false
    })
    declare authMethod: AuthMethod

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isVerified: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isTwoFactorEnabled: boolean

    @HasMany(() => ChatMember)
    chatMembers: ChatMember[]

    @HasMany(() => Message)
    messages: Message[]

    @HasOne(() => Account)
    account: Account

    @HasOne(() => PregameRoomMember)
    pregameRoomMember: PregameRoomMember

    @HasMany(() => Player)
    player: Player[]
}