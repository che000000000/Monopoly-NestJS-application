import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsString({ message: 'email should be string' })
    @IsNotEmpty({ message: 'email is not received' })
    email: string

    @IsString({ message: 'name should be string' })
    @IsNotEmpty({ message: 'name is not received' })
    name: string

    @IsString({ message: 'password should be string' })
    @IsOptional()
    password?: string

    @IsString({ message: 'avatarUrl should be string' })
    @IsOptional()
    avatarUrl?: string

    @IsString({ message: 'authMethod should be string' })
    @IsNotEmpty({ message: 'authMethod is not received' })
    authMethod: string
}