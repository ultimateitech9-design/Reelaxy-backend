import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `coupons` table (replaces all earlier migrations for it).
export class CreateCouponsTable1800000008000 implements MigrationInterface {
  name = 'CreateCouponsTable1800000008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`coupons\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`code\` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`discountPercent\` int unsigned NOT NULL,
  \`applicablePlan\` enum('all','gold','platinum','coins') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  \`expiresAt\` datetime DEFAULT NULL,
  \`maxUses\` int unsigned DEFAULT NULL,
  \`usedCount\` int unsigned NOT NULL DEFAULT '0',
  \`active\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`UQ_e025109230e82925843f2a14c48\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`coupons\``);
  }
}
