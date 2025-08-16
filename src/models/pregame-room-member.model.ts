import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";
import { PregameRoom } from "./pregame-room.model";

@Table({tableName: 'PregameRoomMembers'})
export class PregameRoomMember extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare slot: number

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare isOwner: boolean

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare userId: string

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare pregameRoomId: string
}