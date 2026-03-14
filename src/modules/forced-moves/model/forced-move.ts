import { Column, DataType, ForeignKey, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameField } from "src/modules/game-fields/model/game-field";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { v4 } from "uuid";

@Table({ tableName: 'ForcedMoves' })
export class ForcedMove extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare fromGameFieldId: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare toGameFieldId: string

    @HasOne(() => GameTurn)
    gameTurn: GameTurn
}