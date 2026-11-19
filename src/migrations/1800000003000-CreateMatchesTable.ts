import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `matches` table (replaces all earlier migrations for it).
export class CreateMatchesTable1800000003000 implements MigrationInterface {
  name = 'CreateMatchesTable1800000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`matches\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`senderId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`receiverId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`status\` enum('PENDING','MATCHED','DECLINED','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  \`hiddenFromChatForUserIds\` text COLLATE utf8mb4_unicode_ci,
  \`blockedByUserId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`statusBeforeBlock\` enum('PENDING','MATCHED','DECLINED','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`IDX_matches_sender\` (\`senderId\`),
  KEY \`IDX_matches_receiver\` (\`receiverId\`),
  KEY \`IDX_matches_status\` (\`status\`),
  KEY \`IDX_matches_sender_status\` (\`senderId\`,\`status\`,\`createdAt\`),
  KEY \`IDX_matches_receiver_status\` (\`receiverId\`,\`status\`,\`createdAt\`),
  CONSTRAINT \`FK_matches_receiver\` FOREIGN KEY (\`receiverId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_matches_sender\` FOREIGN KEY (\`senderId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`matches\``);
  }
}
