import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `profile_views` table (replaces all earlier migrations for it).
export class CreateProfileViewsTable1800000018000 implements MigrationInterface {
  name = 'CreateProfileViewsTable1800000018000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`profile_views\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`profileUserId\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`viewerUserId\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`detailViewedAt\` datetime(6) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`IDX_profile_views_profile_created\` (\`profileUserId\`,\`createdAt\`),
  KEY \`IDX_profile_views_viewer_created\` (\`viewerUserId\`,\`createdAt\`),
  KEY \`IDX_profile_views_detail_visitors\` (\`profileUserId\`,\`detailViewedAt\`,\`viewerUserId\`),
  CONSTRAINT \`FK_241b85c194020bd82b3cb5fe720\` FOREIGN KEY (\`viewerUserId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_b0550f7dc9dd1e58f19ede1f30e\` FOREIGN KEY (\`profileUserId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`profile_views\``);
  }
}
