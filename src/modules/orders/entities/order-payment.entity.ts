import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentType {
  CARD = 'card',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public orderId: string;

  @OneToOne(() => Order, (order) => order.paymentMethod, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  public order: Order;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  public type: PaymentType;

  @Column()
  public token: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  public status: PaymentStatus;

  @CreateDateColumn()
  public createdAt: Date;
}
