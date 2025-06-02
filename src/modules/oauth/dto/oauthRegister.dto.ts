import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"

export class OauthRegisterDto {
    @IsString({ message: "type should be string" })
    @IsNotEmpty({ message: "type not received" })
    type: string

    @IsString({ message: "provider should be string" })
    @IsNotEmpty({ message: "provider not received" })
    provider: string

    @IsString({ message: "email should be string" })
    @IsNotEmpty({ message: "email not received" })
    email: string

    @IsString({ message: "name should be string" })
    @IsNotEmpty({ message: "name not received" })
    name: string

    @IsString({ message: "picture should be string" })
    @IsOptional()
    picture?: string

    @IsString({ message: "accessToken should be string" })
    @IsOptional()
    accessToken?: string

    @IsString({ message: "refreshToken should be string" })
    @IsOptional()
    refreshToken?: string

    @IsString({ message: "expiresIn should be string" })
    @IsOptional()
    expires?: string
}