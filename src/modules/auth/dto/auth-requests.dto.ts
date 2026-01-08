import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  // @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordRequest {
  @IsEmail()
  email: string;
}

export class ResetPasswordRequest {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyEmailRequest {
  @IsString()
  token: string;
}
