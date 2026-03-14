import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public templateKey: string;

  @Column()
  public name: string;

  @Column()
  public subject: string;

  @Column({ type: 'text' })
  public htmlBody: string;

  @Column({ type: 'text', nullable: true })
  public textBody?: string;

  @Column({ type: 'simple-array', nullable: true })
  public variables?: string[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
