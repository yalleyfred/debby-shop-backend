import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  IsNull,
  Repository,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import { Order, OrderStatus } from '../entities/order.entity';
// OrderItem is created via TypeORM cascade; no direct class reference needed
import {
  OrderAddress,
  OrderAddressType,
} from '../entities/order-address.entity';
import { PaymentStatus, PaymentType } from '../entities/order-payment.entity';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import {
  CreateOrderRequest,
  OrderItemRequest,
} from '../dto/order-requests.dto';
import {
  OrderAddressResponse,
  OrderListResponse,
  OrderResponse,
  OrderTrackingResponse,
} from '../dto/order-responses.dto';
import { PaginationOptions } from '../../../shared/types/common.types';
import { EmailService } from '../../email/email.service';

type ValidatedOrderItem = {
  requestItem: OrderItemRequest;
  product: Product;
  unitPrice: number;
  totalPrice: number;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  public async createOrder(
    request: CreateOrderRequest,
    currentUser: User,
  ): Promise<OrderResponse> {
    this.ensureAuthorizedCustomer(request.customerId, currentUser);
    await this.ensureCustomerExists(request.customerId);

    const validatedItems = await this.validateAndPriceItems(request.items);
    const subtotal = validatedItems.reduce((sum, v) => sum + v.totalPrice, 0);
    const createdOrder = await this.runOrderTransaction(
      request,
      validatedItems,
      subtotal,
    );

    const response = this.mapOrderToResponse(createdOrder);
    void this.emailService.sendOrderConfirmation(
      currentUser.email,
      currentUser.firstName,
      response.id,
      response.total,
    );

    return response;
  }

  public async getMyOrders(
    currentUser: User,
    options: PaginationOptions,
  ): Promise<OrderListResponse> {
    return this.getPaginatedOrders({ customerId: currentUser.id }, options);
  }

  public async getOrderById(
    orderId: string,
    currentUser: User,
  ): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: {
          product: true,
        },
        addresses: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    this.ensureAuthorizedCustomer(order.customerId, currentUser);

    return this.mapOrderToResponse(order);
  }

  public async trackOrder(orderId: string): Promise<OrderTrackingResponse> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true }, addresses: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const shippingAddress = order.addresses.find(
      (a) => a.type === OrderAddressType.SHIPPING,
    );

    if (!shippingAddress) {
      throw new BadRequestException(
        `Order '${orderId}' is missing a shipping address`,
      );
    }

    return {
      id: order.id,
      status: order.status,
      shippingMethod: order.shippingMethod,
      items: order.items.map((item) => ({
        productName: item.product?.name ?? '',
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      })),
      shippingAddress: this.mapAddress(shippingAddress),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public async getAllOrders(
    _currentUser: User,
    options: PaginationOptions,
  ): Promise<OrderListResponse> {
    return this.getPaginatedOrders({}, options);
  }

  public async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: { product: true },
        addresses: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    await this.orderRepository.update(orderId, { status });

    const updated = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: { product: true },
        addresses: true,
        paymentMethod: true,
      },
    });

    return this.mapOrderToResponse(updated!);
  }

  private ensureAuthorizedCustomer(
    customerId: string,
    currentUser: User,
  ): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.id !== customerId) {
      throw new ForbiddenException(
        'You can only create and access orders for your own account',
      );
    }
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: customerId, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }
  }

  private async runOrderTransaction(
    request: CreateOrderRequest,
    validatedItems: ValidatedOrderItem[],
    subtotal: number,
  ): Promise<Order> {
    const orderData = this.buildOrderData(request, validatedItems, subtotal);

    return this.dataSource.transaction(async (em) => {
      const orderRepo = em.getRepository(Order);
      const productRepo = em.getRepository(Product);

      const saved = await orderRepo.save(orderRepo.create(orderData));

      await Promise.all(
        validatedItems.map((v) =>
          productRepo.update(v.product.id, {
            stock: v.product.stock - v.requestItem.quantity,
          }),
        ),
      );

      const hydrated = await orderRepo.findOne({
        where: { id: saved.id },
        relations: {
          items: { product: true },
          addresses: true,
          paymentMethod: true,
        },
      });

      if (!hydrated) throw new NotFoundException('Order creation failed');
      return hydrated;
    });
  }

  private buildOrderData(
    request: CreateOrderRequest,
    validatedItems: ValidatedOrderItem[],
    subtotal: number,
  ): DeepPartial<Order> {
    return {
      customerId: request.customerId,
      shippingMethod: request.shippingMethod,
      status: OrderStatus.PENDING,
      subtotal,
      total: subtotal,
      saveInfo: request.saveInfo ?? false,
      newsletter: request.newsletter ?? false,
      trafficSource: request.trafficSource,
      items: validatedItems.map((v) => ({
        productId: v.product.id,
        quantity: v.requestItem.quantity,
        selectedSize: v.requestItem.selectedSize,
        selectedColor: v.requestItem.selectedColor,
        unitPrice: v.unitPrice,
        totalPrice: v.totalPrice,
      })),
      addresses: [
        { type: OrderAddressType.SHIPPING, ...request.shippingAddress },
        { type: OrderAddressType.BILLING, ...request.billingAddress },
      ],
      paymentMethod: {
        type: request.paymentMethod.type,
        token: request.paymentMethod.token,
        status: PaymentStatus.PENDING,
      },
    };
  }

  private async validateAndPriceItems(
    items: OrderItemRequest[],
  ): Promise<ValidatedOrderItem[]> {
    const products = await Promise.all(
      items.map((item) =>
        this.productRepository.findOne({
          where: {
            id: item.productId,
            status: ProductStatus.ACTIVE,
            deletedAt: IsNull(),
          },
        }),
      ),
    );
    return items.map((item, i) =>
      this.validateAndPriceSingleItem(item, products[i]),
    );
  }

  private validateAndPriceSingleItem(
    item: OrderItemRequest,
    product: Product | null,
  ): ValidatedOrderItem {
    if (!product) {
      throw new NotFoundException(
        `Product with ID '${item.productId}' not found or unavailable`,
      );
    }
    if (product.stock < item.quantity) {
      throw new BadRequestException(
        `Insufficient stock for '${product.name}'. Available: ${product.stock}`,
      );
    }
    this.validateProductVariants(item, product);
    const unitPrice = Number(product.price);
    return {
      requestItem: item,
      product,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  }

  private validateProductVariants(
    item: OrderItemRequest,
    product: Product,
  ): void {
    if (item.selectedSize) {
      const sizes = product.sizes ?? [];
      if (!sizes.length || !sizes.includes(item.selectedSize)) {
        throw new BadRequestException(
          `Size '${item.selectedSize}' not available for '${product.name}'`,
        );
      }
    }
    if (item.selectedColor) {
      const colors = product.colors ?? [];
      if (!colors.length || !colors.includes(item.selectedColor)) {
        throw new BadRequestException(
          `Color '${item.selectedColor}' not available for '${product.name}'`,
        );
      }
    }
  }

  private mapOrderToResponse(order: Order): OrderResponse {
    const shippingAddress = order.addresses.find(
      (address) => address.type === OrderAddressType.SHIPPING,
    );
    const billingAddress = order.addresses.find(
      (address) => address.type === OrderAddressType.BILLING,
    );

    if (!shippingAddress || !billingAddress) {
      throw new BadRequestException(
        `Order '${order.id}' is missing shipping or billing address`,
      );
    }

    if (!order.paymentMethod) {
      throw new BadRequestException(`Order '${order.id}' is missing payment`);
    }

    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      shippingMethod: order.shippingMethod,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      saveInfo: order.saveInfo,
      newsletter: order.newsletter,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name ?? '',
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      shippingAddress: this.mapAddress(shippingAddress),
      billingAddress: this.mapAddress(billingAddress),
      paymentMethod: {
        type: order.paymentMethod.type as PaymentType,
        token: order.paymentMethod.token,
        status: order.paymentMethod.status,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapAddress(address: OrderAddress): OrderAddressResponse {
    return {
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
    };
  }

  private async getPaginatedOrders(
    where: FindOptionsWhere<Order>,
    options: PaginationOptions,
  ): Promise<OrderListResponse> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortOrder = options.sortOrder ?? 'DESC';

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: {
        items: {
          product: true,
        },
        addresses: true,
        paymentMethod: true,
      },
      order: { createdAt: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      orders: orders.map((order) => this.mapOrderToResponse(order)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1 && totalPages > 0,
      },
    };
  }
}
