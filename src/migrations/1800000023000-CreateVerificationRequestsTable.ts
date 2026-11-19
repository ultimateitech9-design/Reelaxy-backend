import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `verification_requests` table (replaces all earlier migrations for it).
export class CreateVerificationRequestsTable1800000023000 implements MigrationInterface {
  name = 'CreateVerificationRequestsTable1800000023000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`verification_requests\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`idType\` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Government ID',
  \`priority\` enum('low','normal','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  \`status\` enum('pending','under_review','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  \`documents\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_verification_user\` (\`userId\`),
  KEY \`IDX_verification_status\` (\`status\`),
  CONSTRAINT \`FK_verification_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`verification_requests\``);
  }
}
