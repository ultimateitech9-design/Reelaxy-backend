import { MigrationInterface, QueryRunner } from 'typeorm';

// What a block covers: 'all' (status BLOCKED), or only 'calls' / 'messages' (status unchanged).
export class AddMatchBlockScope1800000026000 implements MigrationInterface {
  name = 'AddMatchBlockScope1800000026000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matches' AND column_name = 'blockScope'",
    );
    if (Number(exists?.[0]?.n || 0) === 0) {
      await queryRunner.query("ALTER TABLE `matches` ADD `blockScope` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
    }
    await queryRunner.query("UPDATE `matches` SET `blockScope` = 'all' WHERE `status` = 'BLOCKED' AND `blockScope` IS NULL");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `matches` DROP COLUMN `blockScope`');
  }
}
