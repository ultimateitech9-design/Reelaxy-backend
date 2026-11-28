import { MigrationInterface, QueryRunner } from 'typeorm';

/** Database-driven India locations: states, cities, localities and CSV import jobs. */
export class CreateLocations1800000031000 implements MigrationInterface {
  name = 'CreateLocations1800000031000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`location_states\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(120) NOT NULL,
      \`slug\` varchar(140) NOT NULL,
      \`isActive\` tinyint NOT NULL DEFAULT 1,
      \`cityCount\` int unsigned NOT NULL DEFAULT 0,
      \`localityCount\` int unsigned NOT NULL DEFAULT 0,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`UQ_location_states_slug\` (\`slug\`)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`location_cities\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`stateId\` int NOT NULL,
      \`name\` varchar(160) NOT NULL,
      \`slug\` varchar(180) NOT NULL,
      \`isActive\` tinyint NOT NULL DEFAULT 1,
      \`localityCount\` int unsigned NOT NULL DEFAULT 0,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`UQ_location_cities_state_slug\` (\`stateId\`, \`slug\`),
      INDEX \`IDX_location_cities_slug\` (\`slug\`)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`location_localities\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`cityId\` int NOT NULL,
      \`stateId\` int NOT NULL,
      \`name\` varchar(200) NOT NULL,
      \`slug\` varchar(220) NOT NULL,
      \`isActive\` tinyint NOT NULL DEFAULT 1,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`UQ_location_localities_city_slug\` (\`cityId\`, \`slug\`),
      INDEX \`IDX_location_localities_state\` (\`stateId\`),
      INDEX \`IDX_location_localities_name\` (\`name\`)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`location_import_jobs\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`fileName\` varchar(200) NOT NULL,
      \`mode\` varchar(10) NOT NULL,
      \`status\` varchar(12) NOT NULL DEFAULT 'running',
      \`totalRows\` int unsigned NOT NULL DEFAULT 0,
      \`processedRows\` int unsigned NOT NULL DEFAULT 0,
      \`skippedRows\` int unsigned NOT NULL DEFAULT 0,
      \`newStates\` int unsigned NOT NULL DEFAULT 0,
      \`newCities\` int unsigned NOT NULL DEFAULT 0,
      \`newLocalities\` int unsigned NOT NULL DEFAULT 0,
      \`error\` varchar(300) NULL,
      \`createdBy\` varchar(160) NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`finishedAt\` datetime NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `location_import_jobs`');
    await queryRunner.query('DROP TABLE `location_localities`');
    await queryRunner.query('DROP TABLE `location_cities`');
    await queryRunner.query('DROP TABLE `location_states`');
  }
}
