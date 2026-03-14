import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FaqCategory } from '../entities/faq.entity';

export class UpsertPageDto {
  @IsString()
  public title: string;

  @IsOptional()
  @IsString()
  public content?: string;

  @IsOptional()
  @IsBoolean()
  public isPublished?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  public metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  public metaDescription?: string;
}

export class CreateFaqDto {
  @IsString()
  public question: string;

  @IsString()
  public answer: string;

  @IsEnum(FaqCategory)
  public category: FaqCategory;

  @IsOptional()
  public order?: number;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  public question?: string;

  @IsOptional()
  @IsString()
  public answer?: string;

  @IsOptional()
  @IsEnum(FaqCategory)
  public category?: FaqCategory;

  @IsOptional()
  public order?: number;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}

export class UpsertSeoDto {
  @IsOptional()
  @IsString()
  public siteTitle?: string;

  @IsOptional()
  @IsString()
  public siteTagline?: string;

  @IsOptional()
  @IsString()
  public siteDescription?: string;

  @IsOptional()
  @IsString()
  public siteKeywords?: string;

  @IsOptional()
  @IsString()
  public ogImage?: string;

  @IsOptional()
  @IsString()
  public googleAnalyticsId?: string;

  @IsOptional()
  @IsString()
  public facebookPixelId?: string;

  @IsOptional()
  public customMeta?: Record<string, string>;
}

export class PolicySectionDto {
  @IsString()
  public heading: string;

  @IsString()
  public body: string;
}

export class UpsertPolicyDto {
  @IsString()
  public title: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicySectionDto)
  public sections?: PolicySectionDto[];

  @IsOptional()
  @IsBoolean()
  public isPublished?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  public metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  public metaDescription?: string;
}
