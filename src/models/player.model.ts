import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";
import { Match } from "./match.model";

@Table({ tableName: 'Players'})
export class Player extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId: string

    @ForeignKey(() => Match)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    matchId: string
    
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    name: string

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    avatarUrl: string
}