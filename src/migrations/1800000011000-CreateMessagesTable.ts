import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `messages` table (replaces all earlier migrations for it).
export class CreateMessagesTable1800000011000 implements MigrationInterface {
  name = 'CreateMessagesTable1800000011000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`messages\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`conversationId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`senderId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`receiverId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`content\` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  \`isRead\` tinyint NOT NULL DEFAULT '0',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`deletedForUserIds\` text COLLATE utf8mb4_unicode_ci,
  \`deletedForEveryone\` tinyint NOT NULL DEFAULT '0',
  \`pinnedByUserIds\` text COLLATE utf8mb4_unicode_ci,
  \`starredByUserIds\` text COLLATE utf8mb4_unicode_ci,
  \`replyToMessageId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`editedAt\` datetime DEFAULT NULL,
  \`reactions\` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (\`id\`),
  KEY \`IDX_messages_conversation\` (\`conversationId\`),
  KEY \`IDX_messages_receiver_read\` (\`receiverId\`,\`isRead\`),
  KEY \`FK_messages_sender\` (\`senderId\`),
  KEY \`IDX_messages_conversation_created\` (\`conversationId\`,\`createdAt\`),
  KEY \`IDX_messages_unread\` (\`conversationId\`,\`receiverId\`,\`isRead\`),
  CONSTRAINT \`FK_messages_conversation\` FOREIGN KEY (\`conversationId\`) REFERENCES \`matches\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_messages_receiver\` FOREIGN KEY (\`receiverId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`FK_messages_sender\` FOREIGN KEY (\`senderId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`messages\``);
  }
}
