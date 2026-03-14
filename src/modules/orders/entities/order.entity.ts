import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderAddress } from './order-address.entity';
import { OrderPayment } from './order-payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public customerId: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  public customer: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  public items: OrderItem[];

  @OneToMany(() => OrderAddress, (address) => address.order, {
    cascade: true,
    eager: true,
  })
  public addresses: OrderAddress[];

  @OneToOne(() => OrderPayment, (payment) => payment.order, {
    cascade: true,
    eager: true,
  })
  public paymentMethod: OrderPayment;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
  })
  public shippingMethod: ShippingMethod;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  public status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  public subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  public total: number;

  @Column({ default: false })
  public saveInfo: boolean;

  @Column({ default: false })
  public newsletter: boolean;

  /** UTM / referral source captured at checkout (e.g. 'organic', 'social', 'email', 'direct') */
  @Column({ nullable: true })
  public trafficSource?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
