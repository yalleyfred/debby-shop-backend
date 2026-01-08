import { Transform } from 'class-transformer';
import { ProductStatus } from '../entities/product.entity';

export class ProductResponse {
  @Transform(({ value }) => (value as Date).toISOString())
  public createdAt: Date;

  @Transform(({ value }) => (value as Date).toISOString())
  public updatedAt: Date;

  @Transform(({ value }) => (value ? (value as Date).toISOString() : null))
  public deletedAt?: Date | null;

  public id: string;
  public name: string;
  public description: string;
  public category: string;
  public price: number;
  public originalPrice: number;
  public stock: number;
  public sku: string;
  public sizes: string[];
  public colors: string[];
  public features: string[];
  public images: string[];
  public status: ProductStatus;
  public metaTitle?: string;
  public metaDescription?: string;
  public slug?: string;
}

export class ProductListResponse {
  public products: ProductResponse[];
  public meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
