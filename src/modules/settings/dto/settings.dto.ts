import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertSettingDto {
  @IsString()
  public key: string;

  @IsOptional()
  public value?: unknown;
}

export class UpsertSettingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertSettingDto)
  public settings?: UpsertSettingDto[];
}

export class UpsertPaymentMethodsDto {
  @IsOptional()
  public stripeEnabled?: boolean;

  @IsOptional()
  @IsString()
  public stripePublicKey?: string;

  @IsOptional()
  public paypalEnabled?: boolean;

  @IsOptional()
  @IsString()
  public paypalClientId?: string;

  @IsOptional()
  public bankTransferEnabled?: boolean;

  @IsOptional()
  public codEnabled?: boolean;
}

export class GeneralSettingsDto {
  @IsOptional()
  @IsString()
  public storeName?: string;

  @IsOptional()
  @IsEmail()
  public storeEmail?: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsEnum(['GHS', 'USD', 'EUR'])
  public currency?: string;

  @IsOptional()
  @IsEnum(['Africa/Accra', 'UTC', 'America/New_York'])
  public timezone?: string;

  @IsOptional()
  @IsEnum(['en', 'fr', 'tw'])
  public language?: string;

  @IsOptional()
  @IsString()
  public address?: string;
}

export class SecuritySettingsDto {
  @IsOptional()
  @IsString()
  public sessionTimeout?: string;

  @IsOptional()
  @IsString()
  public rateLimitRequests?: string;

  @IsOptional()
  @IsBoolean()
  public logApiRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  public encryptCustomerData?: boolean;

  @IsOptional()
  @IsBoolean()
  public automatedBackups?: boolean;

  @IsOptional()
  @IsBoolean()
  public gdprCompliance?: boolean;
}

export class UpsertShopSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  public general?: GeneralSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  public security?: SecuritySettingsDto;
}

export interface ShopSettingsResponse {
  general: GeneralSettingsDto | null;
  security: SecuritySettingsDto | null;
}
