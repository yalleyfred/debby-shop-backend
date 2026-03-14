import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../interfaces/auth.interfaces';

export class RegisterRequest {
  @IsEmail()
  public email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
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
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  public newPassword: string;
}

export class VerifyEmailRequest {
  @IsString()
  public token: string;
}

export class UpdateProfileRequest {
  @IsOptional()
  @IsString()
  public firstName?: string;

  @IsOptional()
  @IsString()
  public lastName?: string;

  @IsOptional()
  @IsString()
  public phone?: string;
}

export class Verify2FARequest {
  @IsString()
  public tempToken: string;

  @IsString()
  public code: string;
}

export class Disable2FARequest {
  @IsString()
  public code: string;
}
