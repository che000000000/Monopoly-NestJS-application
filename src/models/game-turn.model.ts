import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "./player.model";
import { Game } from "./game.model";

@Table({ tableName: 'GameTurns' })
export class GameTurn extends Model {
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
        allowNull: false
    })
    declare gameId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare playerId: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare expires: number
}