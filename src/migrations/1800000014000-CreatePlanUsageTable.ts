import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `plan_usage` table (replaces all earlier migrations for it).
export class CreatePlanUsageTable1800000014000 implements MigrationInterface {
  name = 'CreatePlanUsageTable1800000014000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`plan_usage\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`action\` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`targetId\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_plan_usage_user_action_created\` (\`userId\`,\`action\`,\`createdAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`plan_usage\``);
  }
}
