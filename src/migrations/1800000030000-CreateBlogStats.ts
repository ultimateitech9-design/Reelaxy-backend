import { MigrationInterface, QueryRunner } from 'typeorm';

/** Blog article view and like counters, plus one-like-per-visitor records. */
export class CreateBlogStats1800000030000 implements MigrationInterface {
  name = 'CreateBlogStats1800000030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`blog_post_stats\` (
      \`slug\` varchar(160) NOT NULL,
      \`views\` int unsigned NOT NULL DEFAULT 0,
      \`likes\` int unsigned NOT NULL DEFAULT 0,
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`slug\`)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`blog_post_likes\` (
      \`id\` varchar(36) NOT NULL,
      \`slug\` varchar(160) NOT NULL,
      \`visitorId\` varchar(64) NOT NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`UQ_blog_post_likes_slug_visitor\` (\`slug\`, \`visitorId\`)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `blog_post_likes`');
    await queryRunner.query('DROP TABLE `blog_post_stats`');
  }
}
