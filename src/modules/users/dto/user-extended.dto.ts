import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SavedPaymentType } from '../entities/user-payment-method.entity';

export class SendEmailToUserDto {
  @IsString()
  public subject: string;

  @IsString()
  public message: string;
}

export class CreateUserAddressDto {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsString()
  public address: string;

  @IsString()
  public city: string;

  @IsString()
  public state: string;

  @IsString()
  public zipCode: string;

  @IsString()
  public country: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsString()
  public label?: string;

  @IsOptional()
  @IsBoolean()
  public isDefault?: boolean;
}

export class UpdateUserAddressDto {
  @IsOptional()
  @IsString()
  public firstName?: string;

  @IsOptional()
  @IsString()
  public lastName?: string;

  @IsOptional()
  @IsString()
  public address?: string;

  @IsOptional()
  @IsString()
  public city?: string;

  @IsOptional()
  @IsString()
  public state?: string;

  @IsOptional()
  @IsString()
  public zipCode?: string;

  @IsOptional()
  @IsString()
  public country?: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsString()
  public label?: string;

  @IsOptional()
  @IsBoolean()
  public isDefault?: boolean;
}

export class CreateUserPaymentMethodDto {
  @IsEnum(SavedPaymentType)
  public type: SavedPaymentType;

  @IsString()
  public token: string;

  @IsOptional()
  @IsString()
  public last4?: string;

  @IsOptional()
  @IsString()
  public brand?: string;

  @IsOptional()
  @IsString()
  public expiryMonth?: string;

  @IsOptional()
  @IsString()
  public expiryYear?: string;

  @IsOptional()
  @IsBoolean()
  public isDefault?: boolean;
}
