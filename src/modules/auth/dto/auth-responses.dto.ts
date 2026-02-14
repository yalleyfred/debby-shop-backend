import { UserRole } from '../interfaces/auth.interfaces';
import { Transform } from 'class-transformer';

export class UserResponse {
  @Transform(({ value }) => (value as Date).toISOString())
  public createdAt: Date;
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
}

export class MessageResponse {
  public message: string;
}
