import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterDto {
    @IsString({ message: 'email should be string' })
    @IsNotEmpty({ message: 'email is not received' })
    email: string

    @IsString({ message: 'name should be string' })
    @IsNotEmpty({ message: 'name is not received' })
    name: string

    @IsString({ message: 'password should be string' })
    @IsNotEmpty({ message: 'password is not received' })
    password: string

    @IsString({ message: 'repeatPassword should be string' })
    @IsNotEmpty({ message: 'repeatPassword is not received' })
    repeatPassword: string

    @IsString({ message: 'avatarUrl should be string' })
    @IsOptional()
    avatarUrl?: string
}