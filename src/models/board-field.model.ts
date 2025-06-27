import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { GameBoard } from "./game-board.model";
import { Player } from "./player.model";

@Table({tableName: 'boardFields'})
export class BoardField extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => GameBoard)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameBoardId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    declare ownerPlayerId: string | null
}