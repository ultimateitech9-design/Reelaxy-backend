import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `video_calls` table (replaces all earlier migrations for it).
export class CreateVideoCallsTable1800000024000 implements MigrationInterface {
  name = 'CreateVideoCallsTable1800000024000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`video_calls\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`conversationId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`callerId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`receiverId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`status\` enum('ringing','active','ended','rejected','missed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ringing',
  \`startedAt\` timestamp NULL DEFAULT NULL,
  \`endedAt\` timestamp NULL DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  \`callType\` enum('audio','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'video',
  \`mode\` enum('match','direct') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'match',
  \`isFreeTrial\` tinyint(1) NOT NULL DEFAULT '0',
  \`ratePerMinute\` int unsigned DEFAULT NULL,
  \`billedMinutes\` int unsigned NOT NULL DEFAULT '0',
  \`coinsCharged\` int unsigned NOT NULL DEFAULT '0',
  \`endReason\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`ringsReceiver\` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_video_calls_conversation\` (\`conversationId\`),
  KEY \`IDX_video_calls_caller\` (\`callerId\`),
  KEY \`IDX_video_calls_receiver\` (\`receiverId\`),
  KEY \`IDX_video_calls_caller_mode_created\` (\`callerId\`,\`mode\`,\`createdAt\`),
  CONSTRAINT \`FK_video_calls_caller\` FOREIGN KEY (\`callerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_video_calls_conversation\` FOREIGN KEY (\`conversationId\`) REFERENCES \`matches\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_video_calls_receiver\` FOREIGN KEY (\`receiverId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`video_calls\``);
  }
}
