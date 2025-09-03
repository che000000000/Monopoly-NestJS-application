import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { User } from "./user.model";
import { GameTurn } from "./game-turn.model";
import { GameField } from "./game-field.model";

export enum PlayerChip {
    CART = 'CART',
    HAT = 'HAT',
    IRON = 'IRON',
    PENGUIN = 'PINGUIN',
    THIMBLE = 'THIMBLE'
}

export enum PlayerStatus {
    COMMON = 'COMMON',
    IS_TURN_OWNER = 'IS_TURN_OWNER',
    IS_LEFT = 'IS_LEFT'
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
        type: DataType.INTEGER,
        allowNull: false
    })
    declare turnNumber: number

    @Column({
        type: DataType.ENUM(...Object.values(PlayerChip)),
        allowNull: false
    })
    declare chip: PlayerChip

    @Column({
        type: DataType.ENUM(...Object.values(PlayerStatus)),
        allowNull: false
    })
    declare status: PlayerStatus

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare balance: number

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
    declare gameFieldId: string

    @HasOne(() => GameTurn)
    gameTurn: GameTurn

    @HasMany(() => GameField)
    ownFields: GameField[]
}