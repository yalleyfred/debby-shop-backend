import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';

import { User } from '../entities/user.entity';
import { PasswordHashingService } from './password-hashing.service';
import { JWT_CONFIG } from '../../../shared/constants/app.constants';
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../dto/auth-requests.dto';
import {
  AuthResponse,
  UserResponse,
  MessageResponse,
  RefreshTokenResponse,
} from '../dto/auth-responses.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly jwtService: JwtService,
  ) {}

  public async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerData.email },
      withDeleted: true, // Check including soft-deleted users to prevent duplicate emails
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        throw new ConflictException(
          'User with this email was previously deleted. Please contact support for account recovery.',
        );
      }
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordHashingService.hash(
      registerData.password,
    );

    // Generate email verification token
    const emailVerificationToken = randomBytes(
      JWT_CONFIG.EMAIL_TOKEN_LENGTH,
    ).toString('hex');

    // Create user
    const user = this.userRepository.create({
      ...registerData,
      password: hashedPassword,
      emailVerificationToken,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      savedUser.id,
      savedUser.email,
    );

    return {
      user: this.mapToUserResponse(savedUser),
      accessToken,
      refreshToken,
      expiresIn: this.parseDurationToSeconds(
        JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      ),
    };
  }

  public async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Find user by email (excluding soft-deleted users)
    const user = await this.userRepository.findOne({
      where: { email: loginData.email, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordHashingService.verify(
      loginData.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    return {
      user: this.mapToUserResponse(user),
      accessToken,
      refreshToken,
      expiresIn: this.parseDurationToSeconds(
        JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      ),
    };
  }

  public async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  public async verifyEmail(token: string): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token, deletedAt: IsNull() },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  public async forgotPassword(
    forgotPasswordData: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordData.email, deletedAt: IsNull() },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(JWT_CONFIG.EMAIL_TOKEN_LENGTH).toString(
      'hex',
    );
    const resetExpires = new Date(
      Date.now() + JWT_CONFIG.RESET_TOKEN_EXPIRES_IN,
    );

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await this.userRepository.save(user);

    // TODO: Send email with reset token
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  public async resetPassword(
    resetPasswordData: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: resetPasswordData.token,
        passwordResetExpires: MoreThan(new Date()),
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.passwordHashingService.hash(
      resetPasswordData.newPassword,
    );

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  public async refreshToken(userId: string): Promise<RefreshTokenResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      expiresIn: this.parseDurationToSeconds(
        JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      ),
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private parseDurationToSeconds(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return value; // assume seconds if no unit
    }
  }

  private mapToUserResponse(user: User): UserResponse {
    return plainToInstance(UserResponse, {
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
    });
  }
}
