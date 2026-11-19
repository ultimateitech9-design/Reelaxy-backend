import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `divorced_dating_leads` table (replaces all earlier migrations for it).
export class CreateDivorcedDatingLeadsTable1800000009000 implements MigrationInterface {
  name = 'CreateDivorcedDatingLeadsTable1800000009000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`divorced_dating_leads\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`relationshipGoal\` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`ageRange\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`city\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`childrenPreference\` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`divorced_dating_leads\``);
  }
}
