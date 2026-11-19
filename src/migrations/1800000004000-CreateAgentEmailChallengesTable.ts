import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `agent_email_challenges` table (replaces all earlier migrations for it).
export class CreateAgentEmailChallengesTable1800000004000 implements MigrationInterface {
  name = 'CreateAgentEmailChallengesTable1800000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`agent_email_challenges\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`purpose\` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`codeHash\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`expiresAt\` datetime NOT NULL,
  \`sentAt\` datetime NOT NULL,
  \`attempts\` int NOT NULL DEFAULT '0',
  \`sends\` int NOT NULL DEFAULT '1',
  \`windowStartedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`UQ_agent_challenge\` (\`email\`,\`purpose\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`agent_email_challenges\``);
  }
}
