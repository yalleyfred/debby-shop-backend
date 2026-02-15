import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import {
  Order,
  OrderStatus,
  ShippingMethod,
} from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import {
  OrderAddress,
  OrderAddressType,
} from '../entities/order-address.entity';
import {
  OrderPayment,
  PaymentStatus,
  PaymentType,
} from '../entities/order-payment.entity';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import {
  CreateOrderRequest,
  OrderItemRequest,
} from '../dto/order-requests.dto';
import {
  OrderAddressResponse,
  OrderListResponse,
  OrderResponse,
} from '../dto/order-responses.dto';
import { PaginationOptions } from '../../../shared/types/common.types';

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
  ) {}

  public async createOrder(
    request: CreateOrderRequest,
    currentUser: User,
  ): Promise<OrderResponse> {
    this.ensureAuthorizedCustomer(request.customerId, currentUser);
    await this.ensureCustomerExists(request.customerId);

    const validatedItems = await this.validateAndPriceItems(request.items);
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    const createdOrder = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const transactionalOrderRepository =
          transactionalEntityManager.getRepository(Order);
        const transactionalProductRepository =
          transactionalEntityManager.getRepository(Product);

        const order = transactionalOrderRepository.create({
          customerId: request.customerId,
          shippingMethod: request.shippingMethod,
          status: OrderStatus.PENDING,
          subtotal,
          total: subtotal,
          saveInfo: request.saveInfo ?? false,
          newsletter: request.newsletter ?? false,
          items: validatedItems.map((item) => ({
            productId: item.product.id,
            quantity: item.requestItem.quantity,
            selectedSize: item.requestItem.selectedSize,
            selectedColor: item.requestItem.selectedColor,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          addresses: [
            {
              type: OrderAddressType.SHIPPING,
              ...request.shippingAddress,
            },
            {
              type: OrderAddressType.BILLING,
              ...request.billingAddress,
            },
          ],
          paymentMethod: {
            type: request.paymentMethod.type,
            token: request.paymentMethod.token,
            status: PaymentStatus.PENDING,
          },
        });

        const savedOrder = await transactionalOrderRepository.save(order);

        for (const item of validatedItems) {
          await transactionalProductRepository.update(item.product.id, {
            stock: item.product.stock - item.requestItem.quantity,
          });
        }

        const hydratedOrder = await transactionalOrderRepository.findOne({
          where: { id: savedOrder.id },
          relations: {
            items: {
              product: true,
            },
            addresses: true,
            paymentMethod: true,
          },
        });

        if (!hydratedOrder) {
          throw new NotFoundException('Order creation failed');
        }

        return hydratedOrder;
      },
    );

    return this.mapOrderToResponse(createdOrder);
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

  public async getAllOrders(
    _currentUser: User,
    options: PaginationOptions,
  ): Promise<OrderListResponse> {
    return this.getPaginatedOrders({}, options);
  }

  private ensureAuthorizedCustomer(customerId: string, currentUser: User): void {
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

  private async validateAndPriceItems(
    items: OrderItemRequest[],
  ): Promise<ValidatedOrderItem[]> {
    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: {
          id: item.productId,
          status: ProductStatus.ACTIVE,
          deletedAt: IsNull(),
        },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID '${item.productId}' not found or unavailable`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product '${product.name}'. Available: ${product.stock}`,
        );
      }

      if (item.selectedSize) {
        const availableSizes = product.sizes ?? [];
        if (
          availableSizes.length === 0 ||
          !availableSizes.includes(item.selectedSize)
        ) {
          throw new BadRequestException(
            `Selected size '${item.selectedSize}' is not available for product '${product.name}'`,
          );
        }
      }

      if (item.selectedColor) {
        const availableColors = product.colors ?? [];
        if (
          availableColors.length === 0 ||
          !availableColors.includes(item.selectedColor)
        ) {
          throw new BadRequestException(
            `Selected color '${item.selectedColor}' is not available for product '${product.name}'`,
          );
        }
      }

      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;

      validatedItems.push({
        requestItem: item,
        product,
        unitPrice,
        totalPrice,
      });
    }

    return validatedItems;
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
      shippingMethod: order.shippingMethod as ShippingMethod,
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
    where: Partial<Order>,
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
