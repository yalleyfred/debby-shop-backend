import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../interfaces/auth.interfaces';
import { Order } from '../../orders/entities/order.entity';
import { Wishlist } from '../../wishlists/entities/wishlist.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public email: string;

  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column({ nullable: true })
  public phone?: string;

  @Column({ nullable: true })
  public avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  public role: UserRole;

  @Column({ default: false })
  public emailVerified: boolean;

  @Column()
  public password: string;

  @Column({ nullable: true })
  public emailVerificationToken?: string;

  @Column({ nullable: true })
  public passwordResetToken?: string;

  @Column({ nullable: true })
  public passwordResetExpires?: Date;

  @Column({ nullable: true })
  public twoFactorSecret?: string;

  @Column({ default: false })
  public twoFactorEnabled: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt?: Date | null;

  @OneToMany(() => Order, (order) => order.customer)
  public orders: Order[];

  @OneToOne(() => Wishlist, (wishlist) => wishlist.user)
  public wishlist: Wishlist;
}
