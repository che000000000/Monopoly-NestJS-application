import { PlayersService } from "src/modules/players/players.service";
import { PlayersFormatterService } from "../players/players-formatter.service";
import { FormatGamePayment } from "./interfaces/format-game-payment";
import { IGamePayment } from "./interfaces/game-payment";
import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GamePaymentsFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly playersFormatterService: PlayersFormatterService
    ) { }

    private formatGamePayment(data: FormatGamePayment): IGamePayment {
        const { gamePayment, payerPlayer, receiverPaymentPlayer } = data

        return {
            id: gamePayment.id,
            type: gamePayment.type,
            amount: gamePayment.amount,
            isOptional: gamePayment.isOptional,
            payerPlayer,
            receiverPaymentPlayer: receiverPaymentPlayer ?? null,
        }
    }

    async formatGamePaymentAsync(gamePayment: GamePayment): Promise<IGamePayment> {
        const [payerPlayer, receiverPaymentPlayer] = await Promise.all([
            this.playersFormatterService.formatPlayerAsync(
                await this.playersService.getOneByIdOrThrow(gamePayment.payerPlayerId)
            ),
            gamePayment.receiverPlayerId
                ? this.playersFormatterService.formatPlayerAsync(
                    await this.playersService.getOneByIdOrThrow(gamePayment.receiverPlayerId)
                )
                : undefined
        ])

        return this.formatGamePayment({
            gamePayment,
            payerPlayer,
            receiverPaymentPlayer
        })
    }

    async formatGamePaymentsAsync(gamePayments: GamePayment[]): Promise<IGamePayment[]> {
        return Promise.all(
            gamePayments.map(gamePayment => this.formatGamePaymentAsync(gamePayment))
        )
    }
}