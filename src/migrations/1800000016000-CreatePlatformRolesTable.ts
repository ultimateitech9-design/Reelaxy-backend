import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `platform_roles` table (replaces all earlier migrations for it).
export class CreatePlatformRolesTable1800000016000 implements MigrationInterface {
  name = 'CreatePlatformRolesTable1800000016000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`platform_roles\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`role\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`permissions\` int NOT NULL DEFAULT '0',
  \`status\` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_platform_roles_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`platform_roles\``);
  }
}
