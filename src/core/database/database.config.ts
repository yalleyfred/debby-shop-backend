import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { User } from '../../modules/auth/entities/user.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { OrderAddress } from '../../modules/orders/entities/order-address.entity';
import { OrderPayment } from '../../modules/orders/entities/order-payment.entity';
import { Wishlist } from '../../modules/wishlists/entities/wishlist.entity';
import { WishlistItem } from '../../modules/wishlists/entities/wishlist-item.entity';
import {
  APP_CONFIG,
  DATABASE_CONFIG,
  ENVIRONMENTS,
} from '../../shared/constants/app.constants';

export const createDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get(DATABASE_CONFIG.HOST),
  port: parseInt(
    configService.get(DATABASE_CONFIG.PORT) ?? DATABASE_CONFIG.DEFAULT_PORT,
  ),
  username: configService.get(DATABASE_CONFIG.USERNAME),
  password: configService.get(DATABASE_CONFIG.PASSWORD),
  database: configService.get(DATABASE_CONFIG.NAME),
  entities: [
    User,
    Product,
    Order,
    OrderItem,
    OrderAddress,
    OrderPayment,
    Wishlist,
    WishlistItem,
  ],
  synchronize:
    configService.get(APP_CONFIG.NODE_ENV) !== ENVIRONMENTS.PRODUCTION,
  logging: configService.get(APP_CONFIG.NODE_ENV) === ENVIRONMENTS.DEVELOPMENT,
  retryAttempts: DATABASE_CONFIG.RETRY_ATTEMPTS,
  retryDelay: DATABASE_CONFIG.RETRY_DELAY,
});
