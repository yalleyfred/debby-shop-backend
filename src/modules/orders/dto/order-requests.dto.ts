import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../entities/order-payment.entity';
import { ShippingMethod } from '../entities/order.entity';

export class OrderItemRequest {
  @IsUUID()
  public productId: string;

  @IsInt()
  @Min(1)
  public quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public selectedSize?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public selectedColor?: string;
}

export class OrderAddressRequest {
  @IsString()
  @IsNotEmpty()
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  public lastName: string;

  @IsString()
  @IsNotEmpty()
  public address: string;

  @IsString()
  @IsNotEmpty()
  public city: string;

  @IsString()
  @IsNotEmpty()
  public state: string;

  @IsString()
  @IsNotEmpty()
  public zipCode: string;

  @IsString()
  @IsNotEmpty()
  public country: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public phone?: string;
}

export class OrderPaymentMethodRequest {
  @IsEnum(PaymentType)
  public type: PaymentType;

  @IsString()
  @IsNotEmpty()
  public token: string;
}

export class CreateOrderRequest {
  @IsUUID()
  public customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequest)
  public items: OrderItemRequest[];

  @ValidateNested()
  @Type(() => OrderAddressRequest)
  public shippingAddress: OrderAddressRequest;

  @ValidateNested()
  @Type(() => OrderAddressRequest)
  public billingAddress: OrderAddressRequest;

  @ValidateNested()
  @Type(() => OrderPaymentMethodRequest)
  public paymentMethod: OrderPaymentMethodRequest;

  @IsEnum(ShippingMethod)
  public shippingMethod: ShippingMethod;

  @IsOptional()
  @IsBoolean()
  public saveInfo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  public newsletter?: boolean = false;

  @IsOptional()
  @IsString()
  public trafficSource?: string;
}
