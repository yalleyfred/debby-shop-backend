export const APP_CONFIG = {
  PORT: 'PORT',
  NODE_ENV: 'NODE_ENV',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
} as const;

export const ENVIRONMENTS = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
  TEST: 'test',
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  RESET_TOKEN_EXPIRES_IN: 1 * 60 * 60 * 1000, // 1 hour in milliseconds
  EMAIL_TOKEN_LENGTH: 32,
  // Buffer time for smooth refresh (seconds before expiry to trigger refresh)
  REFRESH_BUFFER_TIME: 60, // 1 minute before access token expires
} as const;

export const DATABASE_CONFIG = {
  HOST: 'DB_HOST',
  PORT: 'DB_PORT',
  USERNAME: 'DB_USERNAME',
  PASSWORD: 'DB_PASSWORD',
  NAME: 'DB_NAME',
  DEFAULT_PORT: '5433',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000,
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
