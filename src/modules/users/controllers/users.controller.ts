import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import {
  MessageResponse,
  UserResponse,
} from '../../auth/dto/auth-responses.dto';
import { User } from '../../auth/entities/user.entity';
import { UsersService } from '../services/users.service';
import { UserAddress } from '../entities/user-address.entity';
import { UserPaymentMethod } from '../entities/user-payment-method.entity';
import {
  CreateUserAddressDto,
  CreateUserPaymentMethodDto,
  SendEmailToUserDto,
  UpdateUserAddressDto,
} from '../dto/user-extended.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  public async getAllUsers(
    @CurrentUser() _user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeDeleted') includeDeleted = false,
  ): Promise<{ users: UserResponse[]; total: number }> {
    return this.usersService.getAllUsers(page, limit, includeDeleted);
  }

  @Get(':id')
  public async getUserById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted = false,
  ): Promise<UserResponse> {
    const targetUser = await this.usersService.getUserById(id, includeDeleted);
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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  public async softDeleteUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    if (user.id === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    return this.usersService.softDeleteUser(id);
  }

  @Put(':id/restore')
  public async restoreUser(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return this.usersService.restoreUser(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  public async permanentDeleteUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    if (user.id === id) {
      throw new BadRequestException(
        'You cannot permanently delete your own account',
      );
    }

    return this.usersService.permanentDeleteUser(id);
  }

  @Post(':id/email')
  @HttpCode(HttpStatus.OK)
  public async sendEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendEmailToUserDto,
  ): Promise<MessageResponse> {
    return this.usersService.sendEmailToUser(id, dto.subject, dto.message);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ resetToken: string; message: string }> {
    return this.usersService.adminResetPassword(id);
  }

  // ─── Addresses ─────────────────────────────────────────────────────────────

  @Get(':id/addresses')
  public async getAddresses(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserAddress[]> {
    return this.usersService.getAddresses(id);
  }

  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  public async createAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    return this.usersService.createAddress(id, dto);
  }

  @Put(':id/addresses/:addressId')
  public async updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    return this.usersService.updateAddress(id, addressId, dto);
  }

  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  public async deleteAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<MessageResponse> {
    return this.usersService.deleteAddress(id, addressId);
  }

  // ─── Payment Methods ────────────────────────────────────────────────────────

  @Get(':id/payment-methods')
  public async getPaymentMethods(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserPaymentMethod[]> {
    return this.usersService.getPaymentMethods(id);
  }

  @Post(':id/payment-methods')
  @HttpCode(HttpStatus.CREATED)
  public async createPaymentMethod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUserPaymentMethodDto,
  ): Promise<UserPaymentMethod> {
    return this.usersService.createPaymentMethod(id, dto);
  }

  @Delete(':id/payment-methods/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  public async deletePaymentMethod(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentMethodId', ParseUUIDPipe) paymentMethodId: string,
  ): Promise<MessageResponse> {
    return this.usersService.deletePaymentMethod(id, paymentMethodId);
  }
}
