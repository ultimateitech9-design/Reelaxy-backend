import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `platform_settings` table (replaces all earlier migrations for it).
export class CreatePlatformSettingsTable1800000017000 implements MigrationInterface {
  name = 'CreatePlatformSettingsTable1800000017000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`platform_settings\` (
  \`key\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`value\` json NOT NULL,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`platform_settings\``);
  }
}
