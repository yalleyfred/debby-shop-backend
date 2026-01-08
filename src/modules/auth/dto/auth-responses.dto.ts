import { UserRole } from '../interfaces/auth.interfaces';
import { Transform } from 'class-transformer';

export class UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  emailVerified: boolean;
  @Transform(({ value }) => (value as Date).toISOString())
  createdAt: Date;
  @Transform(({ value }) => (value as Date).toISOString())
  updatedAt: Date;
  @Transform(({ value }) => value ? (value as Date).toISOString() : null)
  deletedAt?: Date | null;
}

export class AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration in seconds
}

export class RefreshTokenResponse {
  accessToken: string;
  expiresIn: number; // Access token expiration in seconds
}

export class MessageResponse {
  message: string;
}
