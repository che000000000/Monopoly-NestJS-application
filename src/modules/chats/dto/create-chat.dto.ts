import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { TiedTo } from "src/models/chat.model";

export class CreateChatDto {
    @IsEnum(TiedTo)
    @IsNotEmpty()
    tiedTo: TiedTo

    @IsUUID()
    @IsNotEmpty()
    userId: string
}