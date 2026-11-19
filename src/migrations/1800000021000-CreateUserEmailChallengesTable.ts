import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `user_email_challenges` table (replaces all earlier migrations for it).
export class CreateUserEmailChallengesTable1800000021000 implements MigrationInterface {
  name = 'CreateUserEmailChallengesTable1800000021000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`user_email_challenges\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`purpose\` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`otpHash\` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`expiresAt\` datetime(6) NOT NULL,
  \`verifiedAt\` datetime DEFAULT NULL,
  \`attempts\` int unsigned NOT NULL DEFAULT '0',
  \`lastSentAt\` datetime(6) NOT NULL,
  \`sendWindowStartedAt\` datetime(6) NOT NULL,
  \`sendCount\` int unsigned NOT NULL DEFAULT '1',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`UQ_user_email_challenge\` (\`userId\`,\`purpose\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_email_challenges\``);
  }
}
