import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";
import { Game } from "./game.model";
import { PregameRoom } from "./pregame-room.model";

@Table({ tableName: 'Players' })
export class Player extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId: string

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false 
    })
    gameId: string

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    pregameRoomId: string
}