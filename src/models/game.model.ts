import { Column, DataType, Default, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "./player.model";
import { Chat } from "./chat.model";

@Table({ tableName: 'Games' })
export class Game extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @HasMany(() => Player)
    players: Player[]

    @HasOne(() => Chat)
    chat: Chat
}