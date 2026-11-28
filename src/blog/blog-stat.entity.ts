import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Public counters for a blog article (the article content itself lives in the frontend). */
@Entity('blog_post_stats')
export class BlogPostStat {
  @PrimaryColumn({ type: 'varchar', length: 160 }) slug: string;
  @Column({ type: 'int', unsigned: true, default: 0 }) views: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) likes: number;
  @UpdateDateColumn() updatedAt: Date;
}
