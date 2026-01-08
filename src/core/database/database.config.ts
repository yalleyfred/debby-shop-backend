import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { User } from '../../modules/auth/entities/user.entity';
import { Product } from '../../modules/products/entities/product.entity';
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
  entities: [User, Product],
  synchronize:
    configService.get(APP_CONFIG.NODE_ENV) !== ENVIRONMENTS.PRODUCTION,
  logging: configService.get(APP_CONFIG.NODE_ENV) === ENVIRONMENTS.DEVELOPMENT,
  retryAttempts: DATABASE_CONFIG.RETRY_ATTEMPTS,
  retryDelay: DATABASE_CONFIG.RETRY_DELAY,
});
