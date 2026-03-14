import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  UpdateProfileRequest,
} from '../dto/auth-requests.dto';
import {
  AuthResponse,
  UserResponse,
  MessageResponse,
  RefreshTokenResponse,
  TwoFactorRequiredResponse,
} from '../dto/auth-responses.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../interfaces/auth.interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  public async register(
    @Body() registerRequest: RegisterRequest,
  ): Promise<AuthResponse> {
    return this.authService.register(registerRequest);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginRequest: LoginRequest,
  ): Promise<AuthResponse | TwoFactorRequiredResponse> {
    return this.authService.login(loginRequest);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(
    @Body() forgotPasswordRequest: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    return this.authService.forgotPassword(forgotPasswordRequest);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    return this.authService.resetPassword(resetPasswordRequest);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  public async verifyEmail(
    @Body() verifyEmailRequest: VerifyEmailRequest,
  ): Promise<MessageResponse> {
    return this.authService.verifyEmail(verifyEmailRequest.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  public async refreshToken(
    @CurrentUser() user: User,
    @Headers('authorization') authHeader: string,
  ): Promise<RefreshTokenResponse> {
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';
    return this.authService.refreshToken(user.id, rawToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  public getProfile(@CurrentUser() user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  public async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileRequest,
  ): Promise<UserResponse> {
    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  public adminOnly(@CurrentUser() user: User): MessageResponse {
    return {
      message: `Hello Admin ${user.firstName}! You have special access.`,
    };
  }

  /**
   * Logout: revoke the supplied refresh token so it cannot be replayed.
   * Body: { refreshToken: string }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<MessageResponse> {
    return this.authService.logout(refreshToken ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserResponse> {
    if (!file) {
      throw new BadRequestException('No avatar file uploaded');
    }
    return this.authService.updateAvatar(user.id, file);
  }

  // -------------------------------------------------------------------------
  // 2FA endpoints
  // -------------------------------------------------------------------------

  /** Step 1 – generate a TOTP secret and QR code URL. */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  public async setup2FA(
    @CurrentUser() user: User,
  ): Promise<{ secret: string; otpauthUrl: string; qrCodeUrl: string }> {
    return this.authService.setup2FA(user.id);
  }

  /** Step 2 – confirm the TOTP code and enable 2FA on the account. */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify-setup')
  @HttpCode(HttpStatus.OK)
  public async verifySetup2FA(
    @CurrentUser() user: User,
    @Body('code') code: string,
  ): Promise<MessageResponse> {
    return this.authService.confirmSetup2FA(user.id, code);
  }

  /**
   * Post-login 2FA verification.
   * Called with the temp token issued by /auth/login when twoFactorEnabled.
   * @Public because it uses its own tempToken, not a full JWT.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  public async verify2FA(
    @Body('tempToken') tempToken: string,
    @Body('code') code: string,
  ): Promise<AuthResponse> {
    return this.authService.verify2FA(tempToken, code);
  }

  /** Disable 2FA after confirming with a valid TOTP code. */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  public async disable2FA(
    @CurrentUser() user: User,
    @Body('code') code: string,
  ): Promise<MessageResponse> {
    return this.authService.disable2FA(user.id, code);
  }
}
