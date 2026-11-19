import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `user_devices` table (replaces all earlier migrations for it).
export class CreateUserDevicesTable1800000020000 implements MigrationInterface {
  name = 'CreateUserDevicesTable1800000020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`user_devices\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`token\` varchar(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  \`platform\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown',
  \`deviceId\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`deviceName\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`appVersion\` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`isActive\` tinyint NOT NULL DEFAULT '1',
  \`lastSeenAt\` datetime(6) NOT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_user_devices_token\` (\`token\`),
  KEY \`IDX_user_devices_user_active\` (\`userId\`,\`isActive\`),
  KEY \`IDX_user_devices_user_device\` (\`userId\`,\`deviceId\`),
  CONSTRAINT \`FK_user_devices_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_devices\``);
  }
}
