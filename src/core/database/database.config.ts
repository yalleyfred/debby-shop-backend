import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { User } from '../../modules/auth/entities/user.entity';
import { RevokedToken } from '../../modules/auth/entities/revoked-token.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { OrderAddress } from '../../modules/orders/entities/order-address.entity';
import { OrderPayment } from '../../modules/orders/entities/order-payment.entity';
import { Wishlist } from '../../modules/wishlists/entities/wishlist.entity';
import { WishlistItem } from '../../modules/wishlists/entities/wishlist-item.entity';
import { NewsletterSubscriber } from '../../modules/newsletter/entities/newsletter-subscriber.entity';
import { ContactSubmission } from '../../modules/contact/entities/contact-submission.entity';
import { Page } from '../../modules/content/entities/page.entity';
import { Faq } from '../../modules/content/entities/faq.entity';
import { SeoSettings } from '../../modules/content/entities/seo-settings.entity';
import { AppSetting } from '../../modules/settings/entities/app-setting.entity';
import { PolicyContent } from '../../modules/content/entities/policy-content.entity';
import { EmailTemplate } from '../../modules/email-templates/entities/email-template.entity';
import { UserAddress } from '../../modules/users/entities/user-address.entity';
import { UserPaymentMethod } from '../../modules/users/entities/user-payment-method.entity';
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
    RevokedToken,
    Product,
    Order,
    OrderItem,
    OrderAddress,
    OrderPayment,
    Wishlist,
    WishlistItem,
    NewsletterSubscriber,
    ContactSubmission,
    Page,
    Faq,
    SeoSettings,
    PolicyContent,
    AppSetting,
    EmailTemplate,
    UserAddress,
    UserPaymentMethod,
  ],
  synchronize:
    configService.get(APP_CONFIG.NODE_ENV) !== ENVIRONMENTS.PRODUCTION,
  logging: configService.get(APP_CONFIG.NODE_ENV) === ENVIRONMENTS.DEVELOPMENT,
  retryAttempts: DATABASE_CONFIG.RETRY_ATTEMPTS,
  retryDelay: DATABASE_CONFIG.RETRY_DELAY,
});
