import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostStat } from './blog-stat.entity';
import { BlogPostLike } from './blog-like.entity';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPostStat, BlogPostLike])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
