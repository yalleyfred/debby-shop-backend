import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactStatus {
  UNREAD = 'unread',
  READ = 'read',
  RESPONDED = 'responded',
}

@Entity('contact_submissions')
export class ContactSubmission {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public name: string;

  @Column()
  public email: string;

  @Column({ nullable: true })
  public subject?: string;

  @Column({ type: 'text' })
  public message: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.UNREAD,
  })
  public status: ContactStatus;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
