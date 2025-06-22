import { IsArray, IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { TiedTo } from "src/models/chat.model";

export class CreateChatDto {
    @IsEnum(TiedTo)
    @IsNotEmpty()
    tiedTo: TiedTo

    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty({ each: true })
    usersIds: string[]
}