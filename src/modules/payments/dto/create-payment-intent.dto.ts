import {
  IsInt,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentIntentDto {
  /**
   * Amount in the smallest currency unit (e.g. cents for USD).
   * Example: 1999 = $19.99
   */
  @IsInt()
  @Min(50)
  public amount: number;

  /**
   * ISO 4217 currency code, e.g. "usd", "eur", "gbp"
   */
  @IsISO4217CurrencyCode()
  public currency: string;

  @IsOptional()
  @IsUUID()
  public orderId?: string;

  @IsOptional()
  @IsString()
  public description?: string;
}
