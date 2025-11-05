import { IsEmail, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateSubscriberDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
