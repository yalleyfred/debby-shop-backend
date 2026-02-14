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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
