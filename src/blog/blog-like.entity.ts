import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** One like per visitor per article. visitorId is a random id kept in the visitor's browser. */
@Entity('blog_post_likes')
@Index('UQ_blog_post_likes_slug_visitor', ['slug', 'visitorId'], { unique: true })
export class BlogPostLike {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 160 }) slug: string;
  @Column({ type: 'varchar', length: 64 }) visitorId: string;
  @CreateDateColumn() createdAt: Date;
}
