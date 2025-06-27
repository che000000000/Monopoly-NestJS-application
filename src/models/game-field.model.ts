import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "./player.model";
import { Game } from "./game.model";

export enum FieldType {
    PROPERTY = 'PROPERTY',
    RAILROAD = 'RAILROAD',
    UTILITY = 'UTILITY',
    CHANCE = 'CHANCE',
    COMMUNITY_CHEST = 'COMMUNITY_CHEST',
    TAX = 'TAX',
    JAIL = 'JAIL',
    GO_TO_JAIL = 'GO_TO_JAIL',
    FREE_PARKING = 'FREE_PARKING',
    GO = 'GO'
}

@Table({tableName: 'gameFields'})
export class GameField extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(FieldType)),
        allowNull: false
    })
    declare type: FieldType

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare position: number

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare rent: number[]

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare basePrice: Number

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare housePrice: Number

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare buildsCount: number

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