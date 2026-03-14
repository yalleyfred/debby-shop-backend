import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductRepositoryImpl } from '../repositories/product.repository';
import {
  ProductService,
  ProductFilterOptions,
} from '../interfaces/product.interfaces';
import { ProductResponse } from '../dto/product-responses.dto';
import {
  PaginationOptions,
  PaginationResult,
} from '../../../shared/types/common.types';
import { CloudinaryService } from '../../media/services/cloudinary.service';

@Injectable()
export class ProductServiceImpl implements ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryImpl,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  public async create(
    productData: Partial<Product>,
    imagePublicIds?: string[],
  ): Promise<Product> {
    try {
      this.ensureCloudinaryImageUrls(productData.images);

      // Validate SKU uniqueness
      if (productData.sku) {
        const existingProduct = await this.productRepository.findBySku(
          productData.sku,
        );
        if (existingProduct) {
          throw new ConflictException(
            `Product with SKU '${productData.sku}' already exists`,
          );
        }
      }

      // Generate slug from name
      if (productData.name) {
        productData.slug = this.generateSlug(productData.name);
      }

      const product = this.productRepository.create(productData);
      return this.productRepository.save(product);
    } catch (error) {
      await this.cleanupUploadedImages(imagePublicIds);
      throw error;
    }
  }

  public async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return product;
  }

  public async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }
    return product;
  }

  public async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }
    return product;
  }

  public async findAll(
    options: PaginationOptions,
    filters?: ProductFilterOptions,
  ): Promise<PaginationResult<Product>> {
    return this.productRepository.findAll(options, filters);
  }

  public async update(
    id: string,
    updateData: Partial<Product>,
    imagePublicIds?: string[],
  ): Promise<Product> {
    try {
      this.ensureCloudinaryImageUrls(updateData.images);

      const existingProduct = await this.findById(id);

      // Validate SKU uniqueness if SKU is being updated
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const duplicateProduct = await this.productRepository.findBySku(
          updateData.sku,
        );
        if (duplicateProduct) {
          throw new ConflictException(
            `Product with SKU '${updateData.sku}' already exists`,
          );
        }
      }

      // Generate new slug if name is being updated
      if (updateData.name) {
        updateData.slug = this.generateSlug(updateData.name);
      }

      const updatedProduct = await this.productRepository.update(
        id,
        updateData,
      );
      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }

      return updatedProduct;
    } catch (error) {
      await this.cleanupUploadedImages(imagePublicIds);
      throw error;
    }
  }

  public async findDeleted(
    options: PaginationOptions,
  ): Promise<PaginationResult<Product>> {
    return this.productRepository.findDeleted(options);
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.productRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
  }

  public async permanentDelete(id: string): Promise<void> {
    const deleted = await this.productRepository.permanentDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
  }

  public async restore(id: string): Promise<Product> {
    const restoredProduct = await this.productRepository.restore(id);

    if (!restoredProduct) {
      throw new NotFoundException(
        `Product with ID '${id}' not found or not deleted`,
      );
    }

    return restoredProduct;
  }

  public async updateStock(id: string, quantity: number): Promise<Product> {
    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const updatedProduct = await this.productRepository.updateStock(
      id,
      quantity,
    );
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return updatedProduct;
  }

  public async bulkUpdateStatus(
    ids: string[],
    status: ProductStatus,
  ): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('No product IDs provided');
    }

    await this.productRepository.bulkUpdateStatus(ids, status);
  }

  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public async validateSku(sku: string, excludeId?: string): Promise<boolean> {
    const product = await this.productRepository.findBySku(sku);

    if (!product) {
      return true; // SKU is available
    }

    // If we're updating an existing product, exclude it from the check
    return excludeId ? product.id !== excludeId : false;
  }

  public mapToResponse(product: Product): ProductResponse {
    return plainToInstance(ProductResponse, product);
  }

  private ensureCloudinaryImageUrls(images?: string[]): void {
    // TypeORM simple-array stores [] as "" and reads it back as [""] — filter those out
    const nonEmpty = images?.filter((img) => img.trim() !== '');
    if (!nonEmpty || nonEmpty.length === 0) {
      return;
    }

    const invalidImage = nonEmpty.find((image) => !this.isCloudinaryUrl(image.trim()));
    if (invalidImage) {
      throw new BadRequestException(
        `Invalid image URL: "${invalidImage.trim()}". Images must be uploaded via POST /media/upload first`,
      );
    }
  }

  private isCloudinaryUrl(url: string): boolean {
    return /^https?:\/\/res\.cloudinary\.com\/.+/i.test(url);
  }

  private async cleanupUploadedImages(publicIds?: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      return;
    }

    try {
      await this.cloudinaryService.deleteResources(publicIds);
    } catch {
      // Best-effort cleanup; preserve original product error
    }
  }
}
