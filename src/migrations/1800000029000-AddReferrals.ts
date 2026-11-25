import { MigrationInterface, QueryRunner } from 'typeorm';

/** Referral program: each user's share code, who invited them, and when the reward was paid. */
export class AddReferrals1800000029000 implements MigrationInterface {
  name = 'AddReferrals1800000029000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `referralCode` varchar(16) NULL');
    await queryRunner.query('ALTER TABLE `users` ADD `referredById` char(36) NULL');
    await queryRunner.query('ALTER TABLE `users` ADD `referralRewardedAt` datetime NULL');
    await queryRunner.query('CREATE UNIQUE INDEX `IDX_users_referralCode` ON `users` (`referralCode`)');
    await queryRunner.query('CREATE INDEX `IDX_users_referredById` ON `users` (`referredById`)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_users_referredById` ON `users`');
    await queryRunner.query('DROP INDEX `IDX_users_referralCode` ON `users`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `referralRewardedAt`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `referredById`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `referralCode`');
  }
}
