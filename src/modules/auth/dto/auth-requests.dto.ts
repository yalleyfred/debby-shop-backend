import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../interfaces/auth.interfaces';

export class RegisterRequest {
  @IsEmail()
  public email: string;

  @IsString()
  // @MinLength(8)
  public password: string;

  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsOptional()
  public phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  public role?: UserRole;
}

export class LoginRequest {
  @IsEmail()
  public email: string;

  @IsString()
  public password: string;
}

export class ForgotPasswordRequest {
  @IsEmail()
  public email: string;
}

export class ResetPasswordRequest {
  @IsString()
  public token: string;

  @IsString()
  @MinLength(8)
  public newPassword: string;
}

export class VerifyEmailRequest {
  @IsString()
  public token: string;
}
