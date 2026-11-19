import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `subscription_plans` table (replaces all earlier migrations for it).
export class CreateSubscriptionPlansTable1800000019000 implements MigrationInterface {
  name = 'CreateSubscriptionPlansTable1800000019000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`subscription_plans\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`name\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`displayName\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`currency\` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  \`features\` json DEFAULT NULL,
  \`status\` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  \`sortOrder\` int NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_subscription_plans_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`subscription_plans\``);
  }
}
