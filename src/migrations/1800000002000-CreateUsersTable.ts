import { MigrationInterface, QueryRunner } from 'typeorm';

// Final schema of the `users` table (replaces all earlier migrations for it).
export class CreateUsersTable1800000002000 implements MigrationInterface {
  name = 'CreateUsersTable1800000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`name\` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`password\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`birthDate\` date DEFAULT NULL,
  \`gender\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`profession\` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`height\` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`city\` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`locationLatitude\` double DEFAULT NULL,
  \`locationLongitude\` double DEFAULT NULL,
  \`interests\` json DEFAULT NULL,
  \`personalityWords\` json DEFAULT NULL,
  \`bio\` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`photos\` json DEFAULT NULL,
  \`hobbies\` json DEFAULT NULL,
  \`plan\` enum('free','gold','platinum') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free',
  \`status\` enum('active','deactivated','suspended','banned','pending_verification') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  \`role\` enum('user','admin','super_admin','marketing','sales','support') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  \`isVerified\` tinyint NOT NULL DEFAULT '0',
  \`onboardingCompleted\` tinyint NOT NULL DEFAULT '0',
  \`isOnline\` tinyint NOT NULL DEFAULT '0',
  \`lastSeen\` timestamp NULL DEFAULT NULL,
  \`showOnlineStatus\` tinyint NOT NULL DEFAULT '1',
  \`showDistance\` tinyint NOT NULL DEFAULT '1',
  \`photosVisibleToNonMatches\` tinyint NOT NULL DEFAULT '1',
  \`onlyShowVerifiedProfiles\` tinyint NOT NULL DEFAULT '0',
  \`notifyMessages\` tinyint NOT NULL DEFAULT '1',
  \`notifyMatches\` tinyint NOT NULL DEFAULT '1',
  \`notifyPush\` tinyint NOT NULL DEFAULT '1',
  \`darkMode\` tinyint NOT NULL DEFAULT '0',
  \`language\` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  \`kycLivePhoto\` longtext COLLATE utf8mb4_unicode_ci,
  \`kycMatched\` tinyint NOT NULL DEFAULT '0',
  \`kycMatchScore\` int DEFAULT NULL,
  \`kycVerifiedAt\` timestamp NULL DEFAULT NULL,
  \`religion\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`relationshipGoal\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`zodiac\` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`coinBalance\` int unsigned NOT NULL DEFAULT '0',
  \`earnedCoinBalance\` int unsigned NOT NULL DEFAULT '0',
  \`allowDirectCalls\` tinyint(1) NOT NULL DEFAULT '1',
  \`emailVerifiedAt\` timestamp NULL DEFAULT NULL,
  \`planExpiresAt\` datetime DEFAULT NULL,
  \`phone\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`notificationsClearedAt\` datetime DEFAULT NULL,
  \`createdByAgentId\` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`agentEmailChangedAt\` datetime DEFAULT NULL,
  \`callsSeenAt\` datetime DEFAULT NULL,
  \`isGuest\` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_users_email\` (\`email\`),
  KEY \`IDX_users_createdAt\` (\`createdAt\`),
  KEY \`IDX_users_discovery\` (\`status\`,\`role\`,\`birthDate\`,\`createdAt\`),
  KEY \`IDX_users_city_religion\` (\`city\`,\`religion\`),
  KEY \`IDX_users_relationship_goal\` (\`relationshipGoal\`),
  KEY \`IDX_users_agent\` (\`createdByAgentId\`,\`createdAt\`),
  CONSTRAINT \`FK_users_agent\` FOREIGN KEY (\`createdByAgentId\`) REFERENCES \`agents\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
