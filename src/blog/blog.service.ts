import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BlogPostStat } from './blog-stat.entity';
import { BlogPostLike } from './blog-like.entity';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+){0,20}$/;
const VISITOR = /^[A-Za-z0-9_-]{16,64}$/;
const WRITES_PER_MINUTE = 40;

/** Public view and like counters for blog articles. No login needed. */
@Injectable()
export class BlogService {
  private readonly writes = new Map<string, number[]>();

  constructor(
    @InjectRepository(BlogPostStat) private readonly stats: Repository<BlogPostStat>,
    @InjectRepository(BlogPostLike) private readonly likes: Repository<BlogPostLike>,
    private readonly dataSource: DataSource,
  ) {}

  private slug(value: string) {
    const slug = String(value || '').trim().toLowerCase();
    if (slug.length > 160 || !SLUG.test(slug)) throw new BadRequestException('Unknown article.');
    return slug;
  }

  private visitor(value: string) {
    const id = String(value || '').trim();
    if (!VISITOR.test(id)) throw new BadRequestException('Invalid visitor.');
    return id;
  }

  /** Simple per-IP limit so counters can't be spammed. */
  private limit(ip: string) {
    const now = Date.now();
    const recent = (this.writes.get(ip) || []).filter((at) => at > now - 60_000);
    if (recent.length >= WRITES_PER_MINUTE) throw new HttpException('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
    recent.push(now);
    this.writes.set(ip, recent);
    if (this.writes.size > 10_000) this.writes.clear();
  }

  async many(rawSlugs: string[]) {
    const slugs = [...new Set(rawSlugs.map((s) => String(s || '').trim().toLowerCase()).filter((s) => SLUG.test(s) && s.length <= 160))].slice(0, 60);
    if (!slugs.length) return {};
    const rows = await this.stats.find({ where: { slug: In(slugs) } });
    return Object.fromEntries(slugs.map((slug) => {
      const row = rows.find((r) => r.slug === slug);
      return [slug, { views: row?.views ?? 0, likes: row?.likes ?? 0 }];
    }));
  }

  async one(rawSlug: string, rawVisitor?: string) {
    const slug = this.slug(rawSlug);
    const row = await this.stats.findOne({ where: { slug } });
    const visitorId = rawVisitor && VISITOR.test(rawVisitor) ? rawVisitor : null;
    const liked = visitorId ? await this.likes.exists({ where: { slug, visitorId } }) : false;
    return { views: row?.views ?? 0, likes: row?.likes ?? 0, liked };
  }

  async view(rawSlug: string, ip: string) {
    const slug = this.slug(rawSlug);
    this.limit(ip);
    await this.dataSource.query(
      'INSERT INTO blog_post_stats (slug, views, likes) VALUES (?, 1, 0) ON DUPLICATE KEY UPDATE views = views + 1',
      [slug],
    );
    const row = await this.stats.findOne({ where: { slug } });
    return { views: row?.views ?? 1, likes: row?.likes ?? 0 };
  }

  /** Like or unlike (toggle) for this visitor. */
  async toggleLike(rawSlug: string, rawVisitor: string, ip: string) {
    const slug = this.slug(rawSlug);
    const visitorId = this.visitor(rawVisitor);
    this.limit(ip);
    return this.dataSource.transaction(async (manager) => {
      await manager.query('INSERT INTO blog_post_stats (slug, views, likes) VALUES (?, 0, 0) ON DUPLICATE KEY UPDATE slug = slug', [slug]);
      const existing = await manager.getRepository(BlogPostLike).findOne({ where: { slug, visitorId } });
      if (existing) {
        await manager.getRepository(BlogPostLike).delete(existing.id);
        await manager.query('UPDATE blog_post_stats SET likes = GREATEST(likes, 1) - 1 WHERE slug = ?', [slug]);
      } else {
        await manager.getRepository(BlogPostLike).insert({ slug, visitorId });
        await manager.query('UPDATE blog_post_stats SET likes = likes + 1 WHERE slug = ?', [slug]);
      }
      const row = await manager.getRepository(BlogPostStat).findOne({ where: { slug } });
      return { liked: !existing, likes: row?.likes ?? 0, views: row?.views ?? 0 };
    });
  }
}
