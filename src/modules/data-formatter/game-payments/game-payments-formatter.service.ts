import { PlayersService } from "src/modules/players/players.service";
import { PlayersFormatterService } from "../players/players-formatter.service";
import { FormatGamePayment } from "./interfaces/format-game-payment";
import { IGamePayment } from "./interfaces/game-payment";
import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { Injectable } from "@nestjs/common";
import { GameFieldsService } from "src/modules/game-fields/game-fields.service";
import { GameFieldsFormatterService } from "../game-fields/game-fields-formatter.service";

@Injectable()
export class GamePaymentsFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly playersFormatterService: PlayersFormatterService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameFieldsFormatterService: GameFieldsFormatterService
    ) { }

    private formatGamePayment(data: FormatGamePayment): IGamePayment {
        const { gamePayment, payerPlayer, receiverPaymentPlayer, buildingPropertyGameField } = data

        return {
            id: gamePayment.id,
            type: gamePayment.type,
            amount: gamePayment.amount,
            isOptional: gamePayment.isOptional,
            payerPlayer,
            receiverPaymentPlayer: receiverPaymentPlayer ?? null,
            buildingPropertyGameField: buildingPropertyGameField ?? null
        }
    }

    async formatGamePaymentAsync(gamePayment: GamePayment): Promise<IGamePayment> {
        const [payerPlayer, receiverPaymentPlayer, buildingPropertyGameField] = await Promise.all([
            this.playersFormatterService.formatPlayerAsync(
                await this.playersService.getOneByIdOrThrow(gamePayment.payerPlayerId)
            ),
            gamePayment.receiverPlayerId
                ? await this.playersFormatterService.formatPlayerAsync(
                    await this.playersService.getOneByIdOrThrow(gamePayment.receiverPlayerId)
                )
                : undefined,
            gamePayment.buildingPropertyGameFieldId 
                ? await this.gameFieldsFormatterService.formatGameFieldAsync(
                    await this.gameFieldsService.getOneOrThrow(gamePayment.buildingPropertyGameFieldId)
                ) 
                : undefined
        ])

        return this.formatGamePayment({
            gamePayment,
            payerPlayer,
            receiverPaymentPlayer,
            buildingPropertyGameField
        })
    }

    async formatGamePaymentsAsync(gamePayments: GamePayment[]): Promise<IGamePayment[]> {
        return Promise.all(
            gamePayments.map(gamePayment => this.formatGamePaymentAsync(gamePayment))
        )
    }
}