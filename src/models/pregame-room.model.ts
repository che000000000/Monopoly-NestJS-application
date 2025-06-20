import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "./chat.model";
import { User } from "./user.model";

@Table({ tableName: 'PregameRooms' })
export class PregameRoom extends Model {
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
    declare ownerId: string

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare chatId: string

    @HasMany(() => User, {foreignKey: 'pregameRoomId'})
    users: User[]
}