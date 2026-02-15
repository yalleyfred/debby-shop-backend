import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderAddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

@Entity('order_addresses')
export class OrderAddress {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public orderId: string;

  @ManyToOne(() => Order, (order) => order.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  public order: Order;

  @Column({
    type: 'enum',
    enum: OrderAddressType,
  })
  public type: OrderAddressType;

  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column()
  public address: string;

  @Column()
  public city: string;

  @Column()
  public state: string;

  @Column()
  public zipCode: string;

  @Column()
  public country: string;

  @Column({ nullable: true })
  public phone?: string;
}
