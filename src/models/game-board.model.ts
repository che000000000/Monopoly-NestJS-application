import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { BoardField } from "./board-field.model";
import { Game } from "./game.model";

@Table({ tableName: 'gameBoards' })
export class GameBoard extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameId: string

    @HasMany(() => BoardField)
    fields: BoardField[]
}