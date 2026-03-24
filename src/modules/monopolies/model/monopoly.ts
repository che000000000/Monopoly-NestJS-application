import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameField } from "src/modules/game-fields/model/game-field";
import { Game } from "src/modules/games/model/game";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum MonopolyColor {
    BROWN = '#5a382a',
    WHITE_MOON = '#9cc3e4',
    PURPLE = '#cf2a5bff',
    ORANGE = '#f38823ff',
    RED = '#c02525ff',
    YELLOW = '#ffeb38',
    GREEN = '#1b7928ff',
    BLUE = '#1c42aa'
}

@Table({ tableName: 'Monopolies' })
export class Monopoly extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(MonopolyColor)),
        allowNull: false
    })
    declare color: MonopolyColor

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare playerId: string | null

    @HasMany(() => GameField)
    gameFields: GameField
}