import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinUserToRoom {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    roomId: string
}