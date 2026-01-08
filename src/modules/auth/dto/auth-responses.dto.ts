import { UserRole } from '../entities/user.entity';
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
}

export class AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export class MessageResponse {
  message: string;
}
