import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `agents` table (replaces all earlier migrations for it).
export class CreateAgentsTable1800000001000 implements MigrationInterface {
  name = 'CreateAgentsTable1800000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`agents\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`name\` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`password\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`sessionVersion\` int NOT NULL DEFAULT '0',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`status\` enum('active','banned','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  \`earnedCoinBalance\` int unsigned NOT NULL DEFAULT '0',
  \`deletedAt\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`agents\``);
  }
}
