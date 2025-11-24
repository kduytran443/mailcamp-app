import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateSubscriberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
