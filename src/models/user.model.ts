import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Account } from "./account.model";
import { Player } from "./player.model";
import { PregameRoom } from "./pregame-room.model";
import { ChatMember } from "./chat-members";

export enum UserRole {
    regular = 'regular',
    admin = 'admin'
}

export enum AuthMethod {
    credentials = 'credentials',
    google = 'google'
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
        defaultValue: null
    })
    declare password?: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    declare avatarUrl?: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.regular
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

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare pregameRoomId: string | null

    @HasMany(() => Player)
    players: Player[]

    @HasMany(() => ChatMember)
    chatMembers: ChatMember[]

    @HasOne(() => Account)
    account: Account

    @HasOne(() => PregameRoom, { foreignKey: 'ownerId' })
    owningRoom: PregameRoom
}