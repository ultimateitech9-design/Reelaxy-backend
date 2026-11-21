import { MigrationInterface, QueryRunner } from 'typeorm';

// Languages a member speaks (shown on profile, used by the Discover language filter).
export class AddUserSpokenLanguages1800000028000 implements MigrationInterface {
  name = 'AddUserSpokenLanguages1800000028000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'spokenLanguages'",
    );
    if (Number(rows?.[0]?.n || 0) === 0) {
      await queryRunner.query('ALTER TABLE `users` ADD `spokenLanguages` json NULL');
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `spokenLanguages`');
  }
}
