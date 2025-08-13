import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class LoginDto {
    @IsEmail()
    @IsNotEmpty({ message: 'email is not received' })
    email: string

    @IsString({ message: 'password should be string' })
    @IsNotEmpty({ message: 'password is not received' })
    password: string
}