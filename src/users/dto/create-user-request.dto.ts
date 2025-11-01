import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserRequestDTO {
 @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
