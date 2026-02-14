import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
}
