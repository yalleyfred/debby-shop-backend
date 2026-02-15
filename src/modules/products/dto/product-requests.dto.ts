import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsString()
  @IsNotEmpty()
  public category: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  public price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  public originalPrice: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  public stock: number;

  @IsString()
  @IsNotEmpty()
  public sku: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public sizes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public colors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public features?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public imagePublicIds?: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  public status?: ProductStatus = ProductStatus.DRAFT;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  public metaTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  public metaDescription?: string;
}

export class UpdateProductRequest {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  public name?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsOptional()
  public category?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  @IsOptional()
  public price?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  @IsOptional()
  public originalPrice?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  @IsOptional()
  public stock?: number;

  @IsString()
  @IsOptional()
  public sku?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public sizes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public colors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public features?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public imagePublicIds?: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  public status?: ProductStatus;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  public metaTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  public metaDescription?: string;
}
