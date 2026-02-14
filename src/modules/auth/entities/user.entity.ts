import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

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

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
