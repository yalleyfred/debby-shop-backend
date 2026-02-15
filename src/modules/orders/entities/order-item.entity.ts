import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  public order: Order;

  @Column()
  public productId: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'productId' })
  public product: Product;

  @Column('int')
  public quantity: number;

  @Column({ nullable: true })
  public selectedSize?: string;

  @Column({ nullable: true })
  public selectedColor?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  public unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  public totalPrice: number;
}
