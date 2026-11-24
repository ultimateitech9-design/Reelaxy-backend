import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Keep the existing storage schema so deployed accounts retain their data.
@Entity('agents')
export class Coordinator {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 150 }) name: string;
  @Column({ unique: true, length: 255 }) email: string;
  @Column({ select: false }) password: string;
  @Column({ default: 0 }) sessionVersion: number;
  @Column({ type: 'enum', enum: ['active', 'banned', 'deleted'], default: 'active' }) status: 'active' | 'banned' | 'deleted';
  /** Share of direct-call coins earned from calls to users this coordinator created. */
  @Column({ type: 'int', unsigned: true, default: 0 }) earnedCoinBalance: number;
  @Column({ type: 'datetime', nullable: true }) deletedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('agent_email_challenges')
@Index('UQ_agent_challenge', ['email', 'purpose'], { unique: true })
export class CoordinatorEmailChallenge {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 255 }) email: string;
  @Column({ length: 16 }) purpose: string;
  @Column({ length: 64 }) codeHash: string;
  @Column({ type: 'datetime' }) expiresAt: Date;
  @Column({ type: 'datetime' }) sentAt: Date;
  @Column({ default: 0 }) attempts: number;
  @Column({ default: 1 }) sends: number;
  @Column({ type: 'datetime' }) windowStartedAt: Date;
}
