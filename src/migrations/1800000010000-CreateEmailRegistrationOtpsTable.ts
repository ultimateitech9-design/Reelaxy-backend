import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `email_registration_otps` table (replaces all earlier migrations for it).
export class CreateEmailRegistrationOtpsTable1800000010000 implements MigrationInterface {
  name = 'CreateEmailRegistrationOtpsTable1800000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`email_registration_otps\` (
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`otpHash\` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`expiresAt\` datetime(6) NOT NULL,
  \`attempts\` int unsigned NOT NULL DEFAULT '0',
  \`lastSentAt\` datetime(6) NOT NULL,
  \`sendWindowStartedAt\` datetime(6) NOT NULL,
  \`sendCount\` int unsigned NOT NULL DEFAULT '1',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`email\`),
  KEY \`IDX_email_registration_otps_expires\` (\`expiresAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`email_registration_otps\``);
  }
}
