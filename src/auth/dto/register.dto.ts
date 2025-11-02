import { IsEmail, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4)
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  // optional: you can add role or other fields if needed
  // @IsString()
  // role?: 'USER' | 'ADMIN';
}
