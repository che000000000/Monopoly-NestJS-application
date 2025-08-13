import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsString({ message: 'email should be string' })
    @IsNotEmpty({ message: 'email is not received' })
    email: string

    @IsString({ message: 'password should be string' })
    @IsOptional()
    password?: string | null

    @IsString({ message: 'authMethod should be string' })
    @IsNotEmpty({ message: 'authMethod is not received' })
    authMethod: string
}