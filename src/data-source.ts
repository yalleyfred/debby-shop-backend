/**
 * TypeORM DataSource for the CLI (migration:generate, migration:run, etc.)
 * This file is used by the TypeORM CLI, NOT by the NestJS application itself.
 * The NestJS app uses src/core/database/database.config.ts via ConfigModule.
 *
 * Usage:
 *   npm run migration:generate -- src/migrations/YourMigrationName
 *   npm run migration:run
 *   npm run migration:revert
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { User } from './modules/auth/entities/user.entity';
import { RevokedToken } from './modules/auth/entities/revoked-token.entity';
import { Product } from './modules/products/entities/product.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { OrderAddress } from './modules/orders/entities/order-address.entity';
import { OrderPayment } from './modules/orders/entities/order-payment.entity';
import { Wishlist } from './modules/wishlists/entities/wishlist.entity';
import { WishlistItem } from './modules/wishlists/entities/wishlist-item.entity';
import { NewsletterSubscriber } from './modules/newsletter/entities/newsletter-subscriber.entity';
import { ContactSubmission } from './modules/contact/entities/contact-submission.entity';
import { Page } from './modules/content/entities/page.entity';
import { Faq } from './modules/content/entities/faq.entity';
import { SeoSettings } from './modules/content/entities/seo-settings.entity';
import { AppSetting } from './modules/settings/entities/app-setting.entity';
import { EmailTemplate } from './modules/email-templates/entities/email-template.entity';
import { UserAddress } from './modules/users/entities/user-address.entity';
import { UserPaymentMethod } from './modules/users/entities/user-payment-method.entity';

config(); // Load .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5433'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Always false for CLI usage
  logging: false,
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
    AppSetting,
    EmailTemplate,
    UserAddress,
    UserPaymentMethod,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
