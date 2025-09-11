import { Table, Column, Model, DataType, ForeignKey, PrimaryKey } from 'sequelize-typescript';
import { Game } from 'src/modules/games/model/game';
import { v4 } from 'uuid';

export enum ActionCardDeckType {
    CHANCE = 'CHANCE',
    COMMUNITY_CHEST = 'COMMUNITY_CHEST'
}

export enum ActionCardType {
    MOVE = 'MOVE',
    MONEY = 'MONEY',
    PAY_PLAYERS = 'PAY_PLAYERS',
    JAIL = 'JAIL',
    GET_OUT_OF_JAIL = 'GET_OUT_OF_JAIL',
    UTILITY = 'UTILITY',
    RAILROAD = 'RAILROAD',
    PROPERTY_REPAIR = 'PROPERTY_REPAIR',
    MOVE_BACK = 'MOVE_BACK'
}

export enum ActionCardMoveDirection {
    ABSOLUTE = 'ABSOLUTE',
    NEAREST = 'NEAREST',
    FORWARD = 'FORWARD',
    BACKWARD = 'BACKWARD'
}

export enum ActionCardPropertyType {
    UTILITY = 'UTILITY',
    RAILROAD = 'RAILROAD',
    ANY = 'ANY'
}

@Table({ tableName: 'ActionCards' })
export class ActionCard extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    declare description: string

    @Column({
        type: DataType.ENUM(...Object.values(ActionCardDeckType)),
        allowNull: false
    })
    declare deckType: ActionCardDeckType

    @Column({
        type: DataType.ENUM(...Object.values(ActionCardType)),
        allowNull: false
    })
    declare type: ActionCardType

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare amount: number

    @Column({
        type: DataType.ENUM(...Object.values(ActionCardMoveDirection)),
        allowNull: true
    })
    declare moveDirection: ActionCardMoveDirection

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare moveSteps: number

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare targetPosition: number

    @Column({
        type: DataType.ENUM(...Object.values(ActionCardPropertyType)),
        allowNull: true
    })
    declare propertyType: ActionCardPropertyType

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare houseCost: number

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare hotelCost: number

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    declare doubleRent: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    declare paymentForCircleValue: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: () => true
    })
    declare isActive: boolean

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameId: string
}