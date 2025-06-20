import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";
import { Chat } from "./chat.model";

@Table({ tableName: 'ChatMembers' })
export class ChatMember extends Model {
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
        allowNull: false,
    })
    declare userId: string

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare chatId: string
}