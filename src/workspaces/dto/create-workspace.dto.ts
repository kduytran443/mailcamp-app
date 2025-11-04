import { IsOptional, IsString, MinLength, IsUrl } from "class-validator";

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  image?: string;
}
