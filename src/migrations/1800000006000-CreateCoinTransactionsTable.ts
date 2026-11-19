import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `coin_transactions` table (replaces all earlier migrations for it).
export class CreateCoinTransactionsTable1800000006000 implements MigrationInterface {
  name = 'CreateCoinTransactionsTable1800000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`coin_transactions\` (
  \`id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`type\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`status\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  \`userId\` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`senderId\` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`receiverId\` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`agentId\` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`callId\` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`grossCoins\` int unsigned NOT NULL,
  \`userCoins\` int unsigned NOT NULL DEFAULT '0',
  \`platformCoins\` int unsigned NOT NULL DEFAULT '0',
  \`agentCoins\` int unsigned NOT NULL DEFAULT '0',
  \`label\` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`payoutAccount\` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`amountPaise\` int unsigned DEFAULT NULL,
  \`gatewayOrderId\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`gatewayPaymentId\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`gatewayPayoutId\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`payoutDetails\` text COLLATE utf8mb4_unicode_ci,
  \`couponCode\` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`discountPaise\` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_c66d736ec63b2ffced75eee59b\` (\`gatewayOrderId\`),
  UNIQUE KEY \`IDX_d639131ed71bbecb30577ec1be\` (\`gatewayPaymentId\`),
  UNIQUE KEY \`IDX_8a8c9485770624bfbba8d7a0c0\` (\`gatewayPayoutId\`),
  KEY \`IDX_coin_transactions_user\` (\`userId\`),
  KEY \`IDX_coin_transactions_sender\` (\`senderId\`),
  KEY \`IDX_coin_transactions_receiver\` (\`receiverId\`),
  KEY \`IDX_coin_transactions_created\` (\`createdAt\`),
  KEY \`IDX_coin_transactions_call\` (\`callId\`),
  KEY \`IDX_coin_transactions_agent\` (\`agentId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`coin_transactions\``);
  }
}
