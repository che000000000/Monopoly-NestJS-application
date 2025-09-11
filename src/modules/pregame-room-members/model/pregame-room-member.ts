import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { PregameRoom } from "src/modules/pregame-rooms/model/pregame-room";
import { User } from "src/modules/users/model/user.model";
import { PlayerChip } from "src/modules/players/model/player";
import { v4 } from "uuid";

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
        type: DataType.ENUM(...Object.values(PlayerChip)),
        allowNull: false
    })
    declare playerChip: PlayerChip

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