import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BlogService } from './blog.service';

function clientIp(request: Request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.ip || 'unknown';
}

/** Public blog counters (views and likes). */
@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get('stats')
  many(@Query('slugs') slugs?: string) {
    return this.blog.many(String(slugs || '').split(','));
  }

  @Get(':slug/stats')
  one(@Param('slug') slug: string, @Query('visitorId') visitorId?: string) {
    return this.blog.one(slug, visitorId);
  }

  @Post(':slug/view')
  view(@Param('slug') slug: string, @Req() request: Request) {
    return this.blog.view(slug, clientIp(request));
  }

  @Post(':slug/like')
  like(@Param('slug') slug: string, @Body() body: { visitorId?: string }, @Req() request: Request) {
    return this.blog.toggleLike(slug, String(body?.visitorId || ''), clientIp(request));
  }
}
