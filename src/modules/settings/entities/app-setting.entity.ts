import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_settings')
export class AppSetting {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public key: string;

  @Column({ type: 'text', nullable: true })
  public value?: string;

  @Column({ nullable: true })
  public label?: string;

  @Column({ nullable: true })
  public group?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
