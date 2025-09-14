import { GamePaymentType } from "src/modules/game-payments/model/game-payment";

export interface IGamePayment {
    id: string,
    type: GamePaymentType,
    amount: number,
}