import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('seo_settings')
export class SeoSettings {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ nullable: true })
  public siteTitle?: string;

  @Column({ nullable: true })
  public siteTagline?: string;

  @Column({ nullable: true })
  public siteDescription?: string;

  @Column({ nullable: true })
  public siteKeywords?: string;

  @Column({ nullable: true })
  public ogImage?: string;

  @Column({ nullable: true })
  public googleAnalyticsId?: string;

  @Column({ nullable: true })
  public facebookPixelId?: string;

  @Column({ type: 'jsonb', nullable: true })
  public customMeta?: Record<string, string>;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
