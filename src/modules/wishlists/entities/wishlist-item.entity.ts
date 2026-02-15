import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('wishlist_items')
@Unique('UQ_wishlist_product', ['wishlistId', 'productId'])
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public wishlistId: string;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wishlistId' })
  public wishlist: Wishlist;

  @Column()
  public productId: string;

  @ManyToOne(() => Product, (product) => product.wishlistItems, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'productId' })
  public product: Product;

  @CreateDateColumn()
  public createdAt: Date;
}
