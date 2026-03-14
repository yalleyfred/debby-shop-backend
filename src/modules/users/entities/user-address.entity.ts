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

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  public user: User;

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

  @Column({ nullable: true })
  public label?: string;

  @Column({ default: false })
  public isDefault: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
