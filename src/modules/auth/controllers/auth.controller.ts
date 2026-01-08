import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
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
  RefreshTokenResponse,
} from '../dto/auth-responses.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../interfaces/auth.interfaces';

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
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  public async getProfile(@CurrentUser() user: User): Promise<UserResponse> {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  public async adminOnly(@CurrentUser() user: User): Promise<MessageResponse> {
    return {
      message: `Hello Admin ${user.firstName}! You have special access.`,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async logout(): Promise<MessageResponse> {
    return { message: 'Logged out successfully' };
  }

  // User Management Endpoints (Admin Only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  public async getAllUsers(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('includeDeleted') includeDeleted: boolean = false,
  ): Promise<{ users: UserResponse[]; total: number }> {
    return this.authService.getAllUsers(page, limit, includeDeleted);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users/:id')
  public async getUserById(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted: boolean = false,
  ): Promise<UserResponse> {
    const targetUser = await this.authService.getUserById(id, includeDeleted);
    return {
      id: targetUser.id,
      email: targetUser.email,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      phone: targetUser.phone,
      avatar: targetUser.avatar,
      role: targetUser.role,
      emailVerified: targetUser.emailVerified,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
      deletedAt: targetUser.deletedAt,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  public async softDeleteUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    // Prevent admin from deleting themselves
    if (user.id === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    
    return this.authService.softDeleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('users/:id/restore')
  public async restoreUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return this.authService.restoreUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/:id/permanent')
  @HttpCode(HttpStatus.OK)
  public async permanentDeleteUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    // Prevent admin from permanently deleting themselves
    if (user.id === id) {
      throw new BadRequestException('You cannot permanently delete your own account');
    }
    
    return this.authService.permanentDeleteUser(id);
  }
}
