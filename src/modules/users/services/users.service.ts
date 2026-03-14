import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
  MessageResponse,
  UserResponse,
} from '../../auth/dto/auth-responses.dto';
import { User } from '../../auth/entities/user.entity';
import { UserAddress } from '../entities/user-address.entity';
import { UserPaymentMethod } from '../entities/user-payment-method.entity';
import {
  CreateUserAddressDto,
  CreateUserPaymentMethodDto,
  UpdateUserAddressDto,
} from '../dto/user-extended.dto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
    @InjectRepository(UserPaymentMethod)
    private readonly paymentMethodRepository: Repository<UserPaymentMethod>,
    private readonly emailService: EmailService,
  ) {}

  public async getAllUsers(
    page = 1,
    limit = 10,
    includeDeleted = false,
  ): Promise<{ users: UserResponse[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: includeDeleted,
      order: { createdAt: 'DESC' },
    });

    return {
      users: users.map((user) => this.mapToUserResponse(user)),
      total,
    };
  }

  public async getUserById(id: string, includeDeleted = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  public async softDeleteUser(id: string): Promise<MessageResponse> {
    const user = await this.getUserById(id);

    if (user.deletedAt) {
      throw new BadRequestException('User is already deleted');
    }

    await this.userRepository.softDelete(id);
    return { message: 'User deleted successfully' };
  }

  public async restoreUser(id: string): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    await this.userRepository.restore(id);
    return { message: 'User restored successfully' };
  }

  public async permanentDeleteUser(id: string): Promise<MessageResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    await this.userRepository.delete(id);
    return { message: 'User permanently deleted' };
  }

  public async sendEmailToUser(
    userId: string,
    subject: string,
    message: string,
  ): Promise<MessageResponse> {
    const user = await this.getUserById(userId);
    await this.emailService.sendCustomEmail(user.email, subject, message);
    return { message: `Email sent to ${user.email}` };
  }

  public async adminResetPassword(
    userId: string,
  ): Promise<{ resetToken: string; message: string }> {
    const user = await this.getUserById(userId);

    const { randomBytes } = await import('crypto');
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await this.userRepository.save(user);

    void this.emailService.sendAdminPasswordResetLink(
      user.email,
      user.firstName,
      resetToken,
    );

    return {
      resetToken,
      message: `Password reset email sent to ${user.email}. Token expires in 1 hour.`,
    };
  }

  // ─── Addresses ─────────────────────────────────────────────────────────────

  public async getAddresses(userId: string): Promise<UserAddress[]> {
    await this.getUserById(userId);
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  public async createAddress(
    userId: string,
    dto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    await this.getUserById(userId);

    if (dto.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    const address = this.addressRepository.create({ userId, ...dto });
    return this.addressRepository.save(address);
  }

  public async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    await this.getUserById(userId);

    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID '${addressId}' not found`);
    }

    if (dto.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    await this.addressRepository.update(addressId, dto);
    return this.addressRepository.findOne({
      where: { id: addressId },
    }) as Promise<UserAddress>;
  }

  public async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<MessageResponse> {
    await this.getUserById(userId);

    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID '${addressId}' not found`);
    }

    await this.addressRepository.delete(addressId);
    return { message: 'Address deleted successfully' };
  }

  // ─── Payment Methods ────────────────────────────────────────────────────────

  public async getPaymentMethods(userId: string): Promise<UserPaymentMethod[]> {
    await this.getUserById(userId);
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  public async createPaymentMethod(
    userId: string,
    dto: CreateUserPaymentMethodDto,
  ): Promise<UserPaymentMethod> {
    await this.getUserById(userId);

    if (dto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    const pm = this.paymentMethodRepository.create({ userId, ...dto });
    return this.paymentMethodRepository.save(pm);
  }

  public async deletePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<MessageResponse> {
    await this.getUserById(userId);

    const pm = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId },
    });

    if (!pm) {
      throw new NotFoundException(
        `Payment method with ID '${paymentMethodId}' not found`,
      );
    }

    await this.paymentMethodRepository.delete(paymentMethodId);
    return { message: 'Payment method removed successfully' };
  }

  public mapToUserResponse(user: User): UserResponse {
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
