import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PolicyType {
  PAYMENT_DELIVERY_TERMS = 'payment-delivery-terms',
  RETURNS_EXCHANGES = 'returns-exchanges',
}

export interface PolicySection {
  heading: string;
  body: string;
}

@Entity('policy_contents')
export class PolicyContent {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'enum', enum: PolicyType, unique: true })
  public type: PolicyType;

  @Column()
  public title: string;

  @Column({ type: 'jsonb', default: [] })
  public sections: PolicySection[];

  @Column({ default: false })
  public isPublished: boolean;

  @Column({ nullable: true })
  public metaTitle?: string;

  @Column({ nullable: true })
  public metaDescription?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
