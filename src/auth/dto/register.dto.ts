import { IsDateString, IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4)
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  timezone: string;
  
  @IsDateString()
  birthDate: string;
}
