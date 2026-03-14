import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Index({ unique: true })
  @Column()
  public jti: string; // JWT ID — unique per token

  @Column()
  public expiresAt: Date; // mirrors the token's exp so we can prune old rows

  @CreateDateColumn()
  public revokedAt: Date;
}
