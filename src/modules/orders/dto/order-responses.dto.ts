import { Expose, Type } from 'class-transformer';
import { OrderStatus, ShippingMethod } from '../entities/order.entity';
import { PaymentStatus, PaymentType } from '../entities/order-payment.entity';

export class OrderItemResponse {
  @Expose()
  public productId: string;

  @Expose()
  public productName: string;

  @Expose()
  public quantity: number;

  @Expose()
  public selectedSize?: string;

  @Expose()
  public selectedColor?: string;

  @Expose()
  public unitPrice: number;

  @Expose()
  public totalPrice: number;
}

export class OrderAddressResponse {
  @Expose()
  public firstName: string;

  @Expose()
  public lastName: string;

  @Expose()
  public address: string;

  @Expose()
  public city: string;

  @Expose()
  public state: string;

  @Expose()
  public zipCode: string;

  @Expose()
  public country: string;

  @Expose()
  public phone?: string;
}

export class OrderPaymentMethodResponse {
  @Expose()
  public type: PaymentType;

  @Expose()
  public token: string;

  @Expose()
  public status: PaymentStatus;
}

export class OrderResponse {
  @Expose()
  public id: string;

  @Expose()
  public customerId: string;

  @Expose()
  public status: OrderStatus;

  @Expose()
  public shippingMethod: ShippingMethod;

  @Expose()
  public subtotal: number;

  @Expose()
  public total: number;

  @Expose()
  public saveInfo: boolean;

  @Expose()
  public newsletter: boolean;

  @Expose()
  @Type(() => OrderItemResponse)
  public items: OrderItemResponse[];

  @Expose()
  @Type(() => OrderAddressResponse)
  public shippingAddress: OrderAddressResponse;

  @Expose()
  @Type(() => OrderAddressResponse)
  public billingAddress: OrderAddressResponse;

  @Expose()
  @Type(() => OrderPaymentMethodResponse)
  public paymentMethod: OrderPaymentMethodResponse;

  @Expose()
  public createdAt: Date;

  @Expose()
  public updatedAt: Date;
}

export class OrderListResponse {
  public orders: OrderResponse[];
  public meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class OrderTrackingItemResponse {
  @Expose()
  public productName: string;

  @Expose()
  public quantity: number;

  @Expose()
  public selectedSize?: string;

  @Expose()
  public selectedColor?: string;
}

export class OrderTrackingResponse {
  @Expose()
  public id: string;

  @Expose()
  public status: OrderStatus;

  @Expose()
  public shippingMethod: ShippingMethod;

  @Expose()
  @Type(() => OrderTrackingItemResponse)
  public items: OrderTrackingItemResponse[];

  @Expose()
  @Type(() => OrderAddressResponse)
  public shippingAddress: OrderAddressResponse;

  @Expose()
  public createdAt: Date;

  @Expose()
  public updatedAt: Date;
}
