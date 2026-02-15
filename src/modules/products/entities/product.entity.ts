import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { WishlistItem } from '../../wishlists/entities/wishlist-item.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  @Index()
  public name: string;

  @Column('text')
  public description: string;

  @Column()
  @Index()
  public category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  public price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  public originalPrice: number;

  @Column('int', { default: 0 })
  public stock: number;

  @Column({ unique: true })
  @Index()
  public sku: string;

  @Column('simple-array', { nullable: true })
  public sizes: string[];

  @Column('simple-array', { nullable: true })
  public colors: string[];

  @Column('simple-array', { nullable: true })
  public features: string[];

  @Column('simple-array', { nullable: true })
  public images: string[];

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  public status: ProductStatus;

  @Column({ nullable: true })
  public metaTitle?: string;

  @Column('text', { nullable: true })
  public metaDescription?: string;

  @Column({ nullable: true })
  @Index()
  public slug?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt?: Date;

  @OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.product)
  public wishlistItems: WishlistItem[];
}
