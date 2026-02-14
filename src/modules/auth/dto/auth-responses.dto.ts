import { UserRole } from '../interfaces/auth.interfaces';
import { Transform } from 'class-transformer';

export class UserResponse {
  @Transform(({ value }) => (value as Date).toISOString())
  public createdAt: Date;
  @Transform(({ value }) => (value as Date).toISOString())
  public updatedAt: Date;
  @Transform(({ value }) => (value as Date | null)?.toISOString?.())
  public deletedAt?: Date | null;
  public id: string;
  public email: string;
  public firstName: string;
  public lastName: string;
  public phone?: string;
  public avatar?: string;
  public role: UserRole;
  public emailVerified: boolean;
}

export class AuthResponse {
  public user: UserResponse;
  public accessToken: string;
  public refreshToken: string;
  public expiresIn: number;
}

export class RefreshTokenResponse {
  public accessToken: string;
  public expiresIn: number;
}

export class MessageResponse {
  public message: string;
}
