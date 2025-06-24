import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { User } from "./user.model";

export enum PlayerColors {
    GREEN = 'green',
    BLUE = 'blue',
    YELLOW = 'yellow',
    PURPLE = 'purple'
}

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
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    declare hisTurn: boolean

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare number: number

    @Column({
        type: DataType.ENUM(...Object.values(PlayerColors)),
        allowNull: false
    })
    declare color: PlayerColors

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
}