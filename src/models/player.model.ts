import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { User } from "./user.model";
import { GameTurn } from "./game-turn.model";
import { GameField } from "./game-field.model";

@Table({ tableName: 'Players' })
export class Player extends Model {
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
    declare turnNumber: number

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameId: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare userId: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare fieldId: string

    @HasOne(() => GameTurn)
    gameTurn: GameTurn

    @HasMany(() => GameField)
    ownFields: GameField[]
}