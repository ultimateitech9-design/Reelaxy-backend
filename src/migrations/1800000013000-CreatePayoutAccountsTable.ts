import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `payout_accounts` table (replaces all earlier migrations for it).
export class CreatePayoutAccountsTable1800000013000 implements MigrationInterface {
  name = 'CreatePayoutAccountsTable1800000013000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`payout_accounts\` (
  \`id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`ownerType\` enum('user','agent') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`ownerId\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`method\` enum('bank','upi') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`accountHolder\` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`bankName\` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`ifsc\` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`accountNumberEncrypted\` text COLLATE utf8mb4_unicode_ci,
  \`accountNumberLast4\` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`upiId\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_payout_accounts_owner\` (\`ownerType\`,\`ownerId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`payout_accounts\``);
  }
}
