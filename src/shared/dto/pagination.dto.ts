import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public limit?: number = 10;

  @IsOptional()
  public sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @Transform(({ value }) => (value as string)?.toUpperCase())
  public sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
