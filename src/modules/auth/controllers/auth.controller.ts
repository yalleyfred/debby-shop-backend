import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';

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
} from '../dto/auth-requests.dto';
import {
  AuthResponse,
  UserResponse,
  MessageResponse,
} from '../dto/auth-responses.dto';
import { User, UserRole } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  public async register(
    @Body() registerRequest: RegisterRequest,
  ): Promise<AuthResponse> {
    return this.authService.register(registerRequest);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginRequest: LoginRequest,
    @CurrentUser() _user: User,
  ): Promise<AuthResponse> {
    return this.authService.login(loginRequest);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(
    @Body() forgotPasswordRequest: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    return this.authService.forgotPassword(forgotPasswordRequest);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    return this.authService.resetPassword(resetPasswordRequest);
  }

  @Public()
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
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(user.id);
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
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  public adminOnly(@CurrentUser() user: User): MessageResponse {
    return {
      message: `Hello Admin ${user.firstName}! You have special access.`,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public logout(): MessageResponse {
    return { message: 'Logged out successfully' };
  }
}
