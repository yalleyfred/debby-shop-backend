import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum SavedPaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
}

@Entity('user_payment_methods')
export class UserPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  public user: User;

  @Column({
    type: 'enum',
    enum: SavedPaymentType,
  })
  public type: SavedPaymentType;

  @Column()
  public token: string;

  @Column({ nullable: true })
  public last4?: string;

  @Column({ nullable: true })
  public brand?: string;

  @Column({ nullable: true })
  public expiryMonth?: string;

  @Column({ nullable: true })
  public expiryYear?: string;

  @Column({ default: false })
  public isDefault: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
