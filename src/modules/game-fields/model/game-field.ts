import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Game } from "src/modules/games/model/game";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GameFieldType {
    PROPERTY = 'PROPERTY',
    RAILROAD = 'RAILROAD',
    UTILITY = 'UTILITY',
    CHANCE = 'CHANCE',
    COMMUNITY_CHEST = 'COMMUNITY_CHEST',
    TAX = 'TAX',
    JUST_VISITING = 'JUST_VISITING',
    GO_TO_JAIL = 'GO_TO_JAIL',
    FREE_PARKING = 'FREE_PARKING',
    GO = 'GO'
}

export enum GameFieldColor {
    BROWN = '#831717ff',
    WHITE_MOON = '#c8e0ffff',
    PURPLE = '#cf2a5bff',
    ORANGE = '#f38823ff',
    RED = '#c02525ff',
    YELLOW = '#f0ec14ff',
    GREEN = '#1b7928ff',
    BLUE = '#4b85dbff'
}

@Table({tableName: 'GameFields'})
export class GameField extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(GameFieldType)),
        allowNull: false
    })
    declare type: GameFieldType

    @Column({
        type: DataType.ENUM(...Object.values(GameFieldColor)),
        allowNull: true
    })
    declare color: GameFieldColor | null

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare position: number

    @Column({
        type: DataType.ARRAY(DataType.INTEGER),
        allowNull: true
    })
    declare rent: number[] | null

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare basePrice: number | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare housePrice: number | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare buildsCount: number | null

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    declare ownerPlayerId: string | null

    @HasMany(() => Player)
    standingPlayers: Player[]
}