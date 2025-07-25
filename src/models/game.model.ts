import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "./chat.model";
import { User } from "./user.model";
import { Player } from "./player.model";
import { GameField } from "./game-field.model";
import { GameTurn } from "./game-turn.model";

@Table({ tableName: 'Games' })
export class Game extends Model {
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
    declare playersSize: number

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare chatId: string

    @HasMany(() => User)
    users: User[]

    @HasMany(() => Player)
    players: Player[]

    @HasMany(() => GameField)
    fields: GameField[]

    @HasOne(() => GameTurn)
    turn: GameTurn
}