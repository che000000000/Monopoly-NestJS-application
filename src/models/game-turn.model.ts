import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "./player.model";

@Table({ tableName: 'gameTurns' })
export class GameTurn extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare playerId: string
}