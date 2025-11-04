import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  pageSize: number = 10;
}
