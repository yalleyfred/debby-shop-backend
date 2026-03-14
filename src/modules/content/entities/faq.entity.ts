import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FaqCategory {
  GENERAL = 'General',
  ORDERS = 'Orders',
  SHIPPING_DELIVERY = 'Shipping & Delivery',
  RETURNS_REFUNDS = 'Returns & Refunds',
  PAYMENT = 'Payment',
  PRODUCTS = 'Products',
  ACCOUNT = 'Account',
  PROMOTIONS_DISCOUNTS = 'Promotions & Discounts',
}

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public question: string;

  @Column({ type: 'text' })
  public answer: string;

  @Column({
    type: 'enum',
    enum: FaqCategory,
    default: FaqCategory.GENERAL,
  })
  public category: FaqCategory;

  @Column({ default: 0 })
  public order: number;

  @Column({ default: true })
  public isActive: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
