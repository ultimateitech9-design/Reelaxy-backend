import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `payments` table (replaces all earlier migrations for it).
export class CreatePaymentsTable1800000012000 implements MigrationInterface {
  name = 'CreatePaymentsTable1800000012000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`payments\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`planName\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`amount\` decimal(10,2) NOT NULL,
  \`currency\` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  \`status\` enum('successful','pending','refunded','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`gateway\` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'razorpay',
  \`gatewayOrderId\` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`gatewayPaymentId\` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`originalAmount\` decimal(10,2) DEFAULT NULL,
  \`discountAmount\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`couponCode\` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_cd19dcf01dffc25c7a84acbb40\` (\`gatewayOrderId\`),
  UNIQUE KEY \`IDX_86bda01243452c444f53837b2f\` (\`gatewayPaymentId\`),
  KEY \`IDX_payments_user\` (\`userId\`),
  KEY \`IDX_payments_status\` (\`status\`),
  CONSTRAINT \`FK_payments_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`payments\``);
  }
}
