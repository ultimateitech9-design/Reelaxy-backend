import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `audit_logs` table (replaces all earlier migrations for it).
export class CreateAuditLogsTable1800000005000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1800000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`user\` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`activity\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`ipAddress\` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '127.0.0.1',
  \`action\` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`module\` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`sessionId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`role\` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`device\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`loginAt\` datetime DEFAULT NULL,
  \`lastActivityAt\` datetime DEFAULT NULL,
  \`logoutAt\` datetime DEFAULT NULL,
  \`durationSeconds\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_audit_logs_sessionId\` (\`sessionId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`audit_logs\``);
  }
}
