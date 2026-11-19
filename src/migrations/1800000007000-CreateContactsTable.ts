import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `contacts` table (replaces all earlier migrations for it).
export class CreateContactsTable1800000007000 implements MigrationInterface {
  name = 'CreateContactsTable1800000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`contacts\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`phone\` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`subject\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`message\` text COLLATE utf8mb4_unicode_ci NOT NULL,
  \`photo_data_url\` longtext COLLATE utf8mb4_unicode_ci,
  \`status\` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`contacts\``);
  }
}
