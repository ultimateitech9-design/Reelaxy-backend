import { MigrationInterface, QueryRunner } from 'typeorm';

// Staff activity log: who did it (email next to name + role).
export class AddAuditLogEmail1800000027000 implements MigrationInterface {
  name = 'AddAuditLogEmail1800000027000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'audit_logs' AND column_name = 'email'",
    );
    if (Number(rows?.[0]?.n || 0) === 0) {
      await queryRunner.query('ALTER TABLE `audit_logs` ADD `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL');
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `audit_logs` DROP COLUMN `email`');
  }
}
