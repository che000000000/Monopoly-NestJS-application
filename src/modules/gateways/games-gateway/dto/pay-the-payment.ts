import { IsNotEmpty, IsUUID } from "class-validator";

export class PayThePaymentDto {
    @IsUUID()
    @IsNotEmpty()
    paymentId: string
}