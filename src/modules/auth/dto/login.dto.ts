import { IsNotEmpty, IsString } from "class-validator"

export class LoginDto {
    @IsString({ message: 'email should be string' })
    @IsNotEmpty({ message: 'email is not received' })
    email: string


    @IsString({ message: 'password should be string' })
    @IsNotEmpty({ message: 'password is not received' })
    password: string
}