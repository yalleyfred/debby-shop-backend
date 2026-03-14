import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cms_pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public slug: string;

  @Column()
  public title: string;

  @Column({ type: 'text', nullable: true })
  public content?: string;

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
