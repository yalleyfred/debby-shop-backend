import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder, IsNull, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import {
  ProductFilterOptions,
  ProductRepository,
} from '../interfaces/product.interfaces';
import {
  PaginationOptions,
  PaginationResult,
} from '../../../shared/types/common.types';

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public create(productData: Partial<Product>): Product {
    return this.productRepository.create(productData);
  }

  public async save(product: Product): Promise<Product> {
    return this.productRepository.save(product);
  }

  public async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  public async findBySku(sku: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { sku, deletedAt: IsNull() },
    });
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });
  }

  public async findAll(
    options: PaginationOptions,
    filters?: ProductFilterOptions,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL');

    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    if (options.sortBy) {
      queryBuilder.orderBy(
        `product.${options.sortBy}`,
        options.sortOrder ?? 'DESC',
      );
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).take(options.limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / options.limit);

    return {
      data: products,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrevious: options.page > 1,
      },
    };
  }

  public async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    // Omit undefined values so unset fields don't overwrite existing data
    const definedFields = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined),
    ) as Partial<Product>;
    Object.assign(existing, definedFields);
    return this.productRepository.save(existing);
  }

  public async findDeleted(
    options: PaginationOptions,
  ): Promise<PaginationResult<Product>> {
    const skip = (options.page - 1) * options.limit;

    const [products, total] = await this.productRepository.findAndCount({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' },
      skip,
      take: options.limit,
    });

    const totalPages = Math.ceil(total / options.limit);

    return {
      data: products,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrevious: options.page > 1,
      },
    };
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  public async updateStock(
    id: string,
    quantity: number,
  ): Promise<Product | null> {
    await this.productRepository.update(id, { stock: quantity });
    return this.findById(id);
  }

  public async bulkUpdateStatus(
    ids: string[],
    status: ProductStatus,
  ): Promise<void> {
    await this.productRepository.update(ids, { status });
  }

  public async permanentDelete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  public async restore(id: string): Promise<Product | null> {
    await this.productRepository.restore(id);
    return this.productRepository.findOne({ where: { id }, withDeleted: true });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    filters?: ProductFilterOptions,
  ): void {
    if (!filters) return;

    if (filters.category) {
      queryBuilder.andWhere('product.category = :category', {
        category: filters.category,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: filters.status,
      });
    }

    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.inStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
  }
}
