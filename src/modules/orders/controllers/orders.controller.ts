import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { CreateOrderRequest } from '../dto/order-requests.dto';
import {
  OrderListResponse,
  OrderResponse,
  OrderTrackingResponse,
} from '../dto/order-responses.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrdersService } from '../services/orders.service';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  public async createOrder(
    @Body() createOrderRequest: CreateOrderRequest,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponse> {
    return this.ordersService.createOrder(createOrderRequest, currentUser);
  }

  @Get('my')
  public async getMyOrders(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ): Promise<OrderListResponse> {
    const paginationOptions = {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder ?? 'DESC',
    };

    return this.ordersService.getMyOrders(currentUser, paginationOptions);
  }

  @Public()
  @Get('track/:id')
  public async trackOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderTrackingResponse> {
    return this.ordersService.trackOrder(id);
  }

  @Get(':id')
  public async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponse> {
    return this.ordersService.getOrderById(id, currentUser);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  public async getAllOrders(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ): Promise<OrderListResponse> {
    const paginationOptions = {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder ?? 'DESC',
    };

    return this.ordersService.getAllOrders(currentUser, paginationOptions);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  public async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }
}
