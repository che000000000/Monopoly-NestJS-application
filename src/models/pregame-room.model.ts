import { Column, DataType, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "./chat.model";
import { PregameRoomMember } from "./pregame-room-member.model";

@Table({ tableName: 'PregameRooms' })
export class PregameRoom extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @HasOne(() => Chat)
    chat: Chat

    @HasMany(() => PregameRoomMember)
    pregameRoomMembers: PregameRoomMember[]
}