import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAccountDto {
    @IsString({ message: "type should be string" })
    @IsNotEmpty({ message: "type not received" })
    type: string

    @IsString({ message: "provider should be string" })
    @IsNotEmpty({ message: "provider not received" })
    provider: string

    @IsString({ message: "accessToken should be string" })
    @IsOptional()
    accessToken?: string

    @IsString({ message: "refreshToken should be string" })
    @IsOptional()
    refreshToken?: string

    @IsString({message: "expiresIn should be string"})
    @IsOptional()
    expires?: string

    @IsUUID(undefined, { message: "userId should be string" })
    @IsNotEmpty({ message: "userId not received" })
    userId: string
}