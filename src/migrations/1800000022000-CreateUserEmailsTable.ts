import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `user_emails` table (replaces all earlier migrations for it).
export class CreateUserEmailsTable1800000022000 implements MigrationInterface {
  name = 'CreateUserEmailsTable1800000022000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`user_emails\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`isPrimary\` tinyint NOT NULL DEFAULT '0',
  \`verifiedAt\` datetime DEFAULT NULL,
  \`loginEnabled\` tinyint NOT NULL DEFAULT '0',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`UQ_user_emails_email\` (\`email\`),
  KEY \`IDX_user_emails_user_primary\` (\`userId\`,\`isPrimary\`),
  CONSTRAINT \`FK_user_emails_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_emails\``);
  }
}
