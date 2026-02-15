import type { Product, ProductStatus } from '../entities/product.entity';
import type {
  PaginationOptions,
  PaginationResult,
} from '../../../shared/types/common.types';

export interface ProductFilterOptions {
  category?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface ProductRepository {
  create(productData: Partial<Product>): Product;
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findAll(
    options: PaginationOptions,
    filters?: ProductFilterOptions,
  ): Promise<PaginationResult<Product>>;
  update(id: string, updateData: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  permanentDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<Product | null>;
  updateStock(id: string, quantity: number): Promise<Product | null>;
  bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<void>;
}

export interface ProductService {
  create(
    productData: Partial<Product>,
    imagePublicIds?: string[],
  ): Promise<Product>;
  findById(id: string): Promise<Product>;
  findBySku(sku: string): Promise<Product>;
  findBySlug(slug: string): Promise<Product>;
  findAll(
    options: PaginationOptions,
    filters?: ProductFilterOptions,
  ): Promise<PaginationResult<Product>>;
  update(
    id: string,
    updateData: Partial<Product>,
    imagePublicIds?: string[],
  ): Promise<Product>;
  delete(id: string): Promise<void>;
  permanentDelete(id: string): Promise<void>;
  restore(id: string): Promise<Product>;
  updateStock(id: string, quantity: number): Promise<Product>;
  bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<void>;
  generateSlug(name: string): string;
  validateSku(sku: string, excludeId?: string): Promise<boolean>;
}
