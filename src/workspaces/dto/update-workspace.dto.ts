import { IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class UpdateWorkspaceDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  image?: string;
}
