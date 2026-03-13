import { IsNotEmpty, IsUUID } from "class-validator";

export class PayPaymentDto {
    @IsUUID()
    @IsNotEmpty()
    paymentId: string
}