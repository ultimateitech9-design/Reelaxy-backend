import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `platform_notifications` table (replaces all earlier migrations for it).
export class CreatePlatformNotificationsTable1800000015000 implements MigrationInterface {
  name = 'CreatePlatformNotificationsTable1800000015000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`platform_notifications\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`campaign\` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`type\` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`audience\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`status\` enum('draft','pending_approval','active','scheduled','sent','paused','rejected','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`description\` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  \`discountPercent\` smallint unsigned DEFAULT NULL,
  \`ctaLabel\` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'View offer',
  \`ctaUrl\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/user/premium',
  \`placement\` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user_dashboard',
  \`createdByUserId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`createdByRole\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`approvedByUserId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`submittedAt\` datetime(6) DEFAULT NULL,
  \`approvedAt\` datetime(6) DEFAULT NULL,
  \`rejectedAt\` datetime(6) DEFAULT NULL,
  \`rejectionReason\` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`startsAt\` datetime(6) DEFAULT NULL,
  \`endsAt\` datetime(6) DEFAULT NULL,
  \`impressions\` int unsigned NOT NULL DEFAULT '0',
  \`clicks\` int unsigned NOT NULL DEFAULT '0',
  \`dismissals\` int unsigned NOT NULL DEFAULT '0',
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_platform_notifications_status_dates\` (\`status\`,\`startsAt\`,\`endsAt\`),
  KEY \`IDX_platform_notifications_creator\` (\`createdByUserId\`,\`createdAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`platform_notifications\``);
  }
}
