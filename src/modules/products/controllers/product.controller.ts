import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { ProductServiceImpl } from '../services/product.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import {
  CreateProductRequest,
  UpdateProductRequest,
} from '../dto/product-requests.dto';
import {
  ProductResponse,
  ProductListResponse,
} from '../dto/product-responses.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ProductFilterOptions } from '../interfaces/product.interfaces';
import { User } from '../../auth/entities/user.entity';
import { ProductStatus } from '../entities/product.entity';
import { UserRole } from '../../auth/interfaces/auth.interfaces';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductServiceImpl) {}

  @Public()
  @Get()
  public async getProducts(
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('status') status?: ProductStatus,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('search') search?: string,
  ): Promise<ProductListResponse> {
    const paginationOptions = {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder ?? 'DESC',
    };

    const filters: ProductFilterOptions = {
      category,
      status: status ?? ProductStatus.ACTIVE, // Default to active products for public
      minPrice,
      maxPrice,
      inStock,
      search,
    };

    const result = await this.productService.findAll(
      paginationOptions,
      filters,
    );

    return {
      products: result.data.map((product) =>
        plainToInstance(ProductResponse, product),
      ),
      meta: result.meta,
    };
  }

  @Public()
  @Get('by-sku/:sku')
  public async getProductBySku(
    @Param('sku') sku: string,
  ): Promise<ProductResponse> {
    const product = await this.productService.findBySku(sku);
    return plainToInstance(ProductResponse, product);
  }

  @Public()
  @Get('by-slug/:slug')
  public async getProductBySlug(
    @Param('slug') slug: string,
  ): Promise<ProductResponse> {
    const product = await this.productService.findBySlug(slug);
    return plainToInstance(ProductResponse, product);
  }

  @Public()
  @Get(':id')
  public async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponse> {
    const product = await this.productService.findById(id);
    return plainToInstance(ProductResponse, product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createProduct(
    @Body() createProductRequest: CreateProductRequest,
    @CurrentUser() _user: User,
  ): Promise<ProductResponse> {
    const { imagePublicIds, ...productData } = createProductRequest;
    const product = await this.productService.create(
      productData,
      imagePublicIds,
    );
    return plainToInstance(ProductResponse, product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  public async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductRequest: UpdateProductRequest,
    @CurrentUser() _user: User,
  ): Promise<ProductResponse> {
    const { imagePublicIds, ...productData } = updateProductRequest;
    const product = await this.productService.update(id, productData, imagePublicIds);
    return plainToInstance(ProductResponse, product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: User,
  ): Promise<void> {
    await this.productService.delete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async permanentDeleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: User,
  ): Promise<void> {
    await this.productService.permanentDelete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/restore')
  public async restoreProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: User,
  ): Promise<ProductResponse> {
    const product = await this.productService.restore(id);
    return plainToInstance(ProductResponse, product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/stock')
  public async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
    @CurrentUser() _user: User,
  ): Promise<ProductResponse> {
    const product = await this.productService.updateStock(id, quantity);
    return plainToInstance(ProductResponse, product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('bulk-status')
  @HttpCode(HttpStatus.OK)
  public async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: ProductStatus,
    @CurrentUser() _user: User,
  ): Promise<{ message: string }> {
    await this.productService.bulkUpdateStatus(ids, status);
    return { message: `Successfully updated ${ids.length} products` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  public async getAllProductsAdmin(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('status') status?: ProductStatus,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('search') search?: string,
  ): Promise<ProductListResponse> {
    const paginationOptions = {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder ?? 'DESC',
    };

    const filters: ProductFilterOptions = {
      category,
      status, // Admin can see all statuses
      minPrice,
      maxPrice,
      inStock,
      search,
    };

    const result = await this.productService.findAll(
      paginationOptions,
      filters,
    );

    return {
      products: result.data.map((product) =>
        plainToInstance(ProductResponse, product),
      ),
      meta: result.meta,
    };
  }
}
