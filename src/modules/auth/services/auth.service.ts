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
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

import { User } from '../entities/user.entity';
import { RevokedToken } from '../entities/revoked-token.entity';
import { PasswordHashingService } from './password-hashing.service';
import { JWT_CONFIG } from '../../../shared/constants/app.constants';
import { CloudinaryService } from '../../media/services/cloudinary.service';
import { EmailService } from '../../email/email.service';
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from '../dto/auth-requests.dto';
import {
  AuthResponse,
  UserResponse,
  MessageResponse,
  RefreshTokenResponse,
  TwoFactorRequiredResponse,
} from '../dto/auth-responses.dto';

// Seconds a temp 2FA token stays valid
const TWO_FACTOR_TEMP_TOKEN_TTL = 600; // 10 minutes

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly emailService: EmailService,
  ) {}

  public async register(registerData: RegisterRequest): Promise<AuthResponse> {
    await this.ensureEmailAvailable(registerData.email);

    const hashedPassword = await this.passwordHashingService.hash(
      registerData.password,
    );
    const emailVerificationToken = randomBytes(
      JWT_CONFIG.EMAIL_TOKEN_LENGTH,
    ).toString('hex');

    const user = this.userRepository.create({
      ...registerData,
      password: hashedPassword,
      emailVerificationToken,
    });

    const savedUser = await this.userRepository.save(user);

    void this.emailService.sendEmailVerification(
      savedUser.email,
      savedUser.firstName,
      emailVerificationToken,
    );

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

  /**
   * Used by LocalStrategy to verify email + password without triggering token
   * generation or 2FA handling.  Returns the User on success, throws on failure.
   */
  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHashingService.verify(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  public async login(
    loginData: LoginRequest,
  ): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginData.email, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHashingService.verify(
      loginData.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA enforcement: if enabled, issue a short-lived temp token instead of
    // full auth tokens. The client must complete /auth/2fa/verify.
    if (user.twoFactorEnabled) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'two_factor_pending' },
        { expiresIn: TWO_FACTOR_TEMP_TOKEN_TTL },
      );
      return {
        requires2FA: true,
        tempToken,
        expiresIn: TWO_FACTOR_TEMP_TOKEN_TTL,
      };
    }

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
      // Constant-time response to prevent email enumeration via timing
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 100),
      );
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

    void this.emailService.sendPasswordReset(
      user.email,
      user.firstName,
      resetToken,
    );

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

  /**
   * Refresh access token using a valid refresh token.
   * The raw refresh token JWT must be passed so we can extract its JTI
   * and block revoked tokens.
   */
  public async refreshToken(
    userId: string,
    rawRefreshToken: string,
  ): Promise<RefreshTokenResponse> {
    // Verify the refresh token and extract JTI
    let payload: { sub: string; email: string; jti: string; exp: number };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        jti: string;
        exp: number;
      }>(rawRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token has been revoked
    if (payload.jti) {
      const revoked = await this.revokedTokenRepository.findOne({
        where: { jti: payload.jti },
      });
      if (revoked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      expiresIn: this.parseDurationToSeconds(
        JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      ),
    };
  }

  /**
   * Revoke the refresh token on logout so it cannot be reused.
   */
  public async logout(rawRefreshToken: string): Promise<MessageResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        jti?: string;
        exp?: number;
      }>(rawRefreshToken);

      if (payload.jti) {
        const expiresAt = payload.exp
          ? new Date(payload.exp * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Only insert if not already revoked (idempotent)
        const exists = await this.revokedTokenRepository.findOne({
          where: { jti: payload.jti },
        });
        if (!exists) {
          await this.revokedTokenRepository.save(
            this.revokedTokenRepository.create({
              jti: payload.jti,
              expiresAt,
            }),
          );
        }
      }
    } catch {
      // Invalid or expired token — treat as already logged out
    }

    return { message: 'Logged out successfully' };
  }

  public async updateProfile(
    userId: string,
    dto: UpdateProfileRequest,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const saved = await this.userRepository.save(user);
    return this.mapToUserResponse(saved);
  }

  public async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const uploaded = await this.cloudinaryService.uploadFile(
      file,
      `users/${user.id}/avatar`,
    );

    user.avatar = uploaded.secureUrl;
    const savedUser = await this.userRepository.save(user);
    return this.mapToUserResponse(savedUser);
  }

  // ---------------------------------------------------------------------------
  // 2FA
  // ---------------------------------------------------------------------------

  public async setup2FA(
    userId: string,
  ): Promise<{ secret: string; otpauthUrl: string; qrCodeUrl: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = this.generateBase32Secret();

    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    const issuer = 'DebbyShop';
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    return { secret, otpauthUrl, qrCodeUrl };
  }

  /**
   * Confirm the TOTP code from the authenticator app and enable 2FA for the
   * account.  The user must have called /auth/2fa/setup first to save a secret.
   */
  public async confirmSetup2FA(
    userId: string,
    code: string,
  ): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException(
        '2FA setup not started. Call POST /auth/2fa/setup first.',
      );
    }

    if (!this.verifyTotpCode(user.twoFactorSecret, code)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    user.twoFactorEnabled = true;
    await this.userRepository.save(user);

    return { message: '2FA enabled successfully' };
  }

  /**
   * Complete login when 2FA is enabled.
   * Validates the short-lived temp token issued during login, then verifies
   * the TOTP code.  Returns full auth tokens on success.
   */
  public async verify2FA(
    tempToken: string,
    code: string,
  ): Promise<AuthResponse> {
    let payload: { sub: string; email: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        type?: string;
      }>(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session token');
    }

    if (payload.type !== 'two_factor_pending') {
      throw new UnauthorizedException(
        'Invalid token type for 2FA verification',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, deletedAt: IsNull() },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled for this account');
    }

    if (!this.verifyTotpCode(user.twoFactorSecret, code)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

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

  /**
   * Disable 2FA after confirming with a valid TOTP code.
   */
  public async disable2FA(
    userId: string,
    code: string,
  ): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled on this account');
    }

    if (!this.verifyTotpCode(user.twoFactorSecret, code)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await this.userRepository.save(user);

    return { message: '2FA disabled successfully' };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });
    if (existing?.deletedAt) {
      throw new ConflictException(
        'User with this email was previously deleted. Please contact support for account recovery.',
      );
    }
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = randomBytes(16).toString('hex');
    const basePayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(basePayload, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      }),
      // Embed jti in refresh token so it can be revoked on logout
      this.jwtService.signAsync(
        { ...basePayload, jti },
        { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Verify a TOTP code (RFC 6238 / RFC 4226) using pure Node.js crypto.
   * Checks the current 30-second window and ±1 window for clock skew.
   */
  private verifyTotpCode(base32Secret: string, token: string): boolean {
    if (!/^\d{6}$/.test(token)) return false;

    const secretBytes = this.base32Decode(base32Secret);
    const counter = Math.floor(Date.now() / 1000 / 30);

    for (let delta = -1; delta <= 1; delta++) {
      const expected = this.generateTotp(secretBytes, counter + delta);
      // Constant-time comparison to avoid timing attacks
      const expectedBuf = Buffer.from(expected.padStart(6, '0'));
      const tokenBuf = Buffer.from(token.padStart(6, '0'));
      if (
        expectedBuf.length === tokenBuf.length &&
        timingSafeEqual(expectedBuf, tokenBuf)
      ) {
        return true;
      }
    }

    return false;
  }

  private generateTotp(secretBytes: Buffer, counter: number): string {
    // Encode counter as 8-byte big-endian
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuf.writeUInt32BE(counter >>> 0, 4);

    const hmac = createHmac('sha1', secretBytes).update(counterBuf).digest();

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1_000_000;

    return String(code).padStart(6, '0');
  }

  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const normalized = input.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of normalized) {
      const idx = alphabet.indexOf(char);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  private generateBase32Secret(): string {
    const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = randomBytes(20);
    let result = '';

    for (let i = 0; i < bytes.length; i += 5) {
      const b0 = bytes[i] ?? 0;
      const b1 = bytes[i + 1] ?? 0;
      const b2 = bytes[i + 2] ?? 0;
      const b3 = bytes[i + 3] ?? 0;
      const b4 = bytes[i + 4] ?? 0;

      result += BASE32_CHARS[(b0 >> 3) & 0x1f];
      result += BASE32_CHARS[((b0 & 0x07) << 2) | ((b1 >> 6) & 0x03)];
      result += BASE32_CHARS[(b1 >> 1) & 0x1f];
      result += BASE32_CHARS[((b1 & 0x01) << 4) | ((b2 >> 4) & 0x0f)];
      result += BASE32_CHARS[((b2 & 0x0f) << 1) | ((b3 >> 7) & 0x01)];
      result += BASE32_CHARS[(b3 >> 2) & 0x1f];
      result += BASE32_CHARS[((b3 & 0x03) << 3) | ((b4 >> 5) & 0x07)];
      result += BASE32_CHARS[b4 & 0x1f];
    }

    return result;
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
        return value;
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
