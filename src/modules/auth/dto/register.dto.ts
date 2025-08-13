import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty({ message: 'email is not received' })
    email: string

    @IsString({ message: 'password should be string' })
    @IsNotEmpty({ message: 'password is not received' })
    password: string

    @IsString({ message: 'repeatPassword should be string' })
    @IsNotEmpty({ message: 'repeatPassword is not received' })
    repeatPassword: string
}