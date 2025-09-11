import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "src/modules/chats/model/chat";
import { PregameRoomMember } from "src/modules/pregame-room-members/model/pregame-room-member";

@Table({ tableName: 'PregameRooms' })
export class PregameRoom extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare chatId: string

    @HasMany(() => PregameRoomMember)
    pregameRoomMembers: PregameRoomMember[]
}