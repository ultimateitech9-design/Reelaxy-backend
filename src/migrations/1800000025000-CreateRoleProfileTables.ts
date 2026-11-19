import { MigrationInterface, QueryRunner } from 'typeorm';

// Per-role profile tables kept in sync with `users` by two triggers.
export class CreateRoleProfileTables1800000025000 implements MigrationInterface {
  name = 'CreateRoleProfileTables1800000025000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`admin_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_admin_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`dating_user_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_dating_user_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`marketing_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_marketing_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`sales_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_sales_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`super_admin_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_super_admin_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`support_profiles\` (
  \`userId\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`metadata\` json DEFAULT NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`userId\`),
  CONSTRAINT \`FK_support_profiles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS \`TRG_users_role_profiles_insert\``);
    await queryRunner.query(`CREATE TRIGGER \`TRG_users_role_profiles_insert\` AFTER INSERT ON \`users\` FOR EACH ROW BEGIN IF NEW.role = 'user' THEN INSERT IGNORE INTO dating_user_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'admin' THEN INSERT IGNORE INTO admin_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'super_admin' THEN INSERT IGNORE INTO super_admin_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'sales' THEN INSERT IGNORE INTO sales_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'support' THEN INSERT IGNORE INTO support_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'marketing' THEN INSERT IGNORE INTO marketing_profiles (userId) VALUES (NEW.id); END IF; END`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS \`TRG_users_role_profiles_update\``);
    await queryRunner.query(`CREATE TRIGGER \`TRG_users_role_profiles_update\` AFTER UPDATE ON \`users\` FOR EACH ROW BEGIN
      IF NOT (OLD.role <=> NEW.role) THEN
        DELETE FROM dating_user_profiles WHERE userId = NEW.id; DELETE FROM admin_profiles WHERE userId = NEW.id; DELETE FROM super_admin_profiles WHERE userId = NEW.id; DELETE FROM sales_profiles WHERE userId = NEW.id; DELETE FROM support_profiles WHERE userId = NEW.id; DELETE FROM marketing_profiles WHERE userId = NEW.id;
        IF NEW.role = 'user' THEN INSERT IGNORE INTO dating_user_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'admin' THEN INSERT IGNORE INTO admin_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'super_admin' THEN INSERT IGNORE INTO super_admin_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'sales' THEN INSERT IGNORE INTO sales_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'support' THEN INSERT IGNORE INTO support_profiles (userId) VALUES (NEW.id); ELSEIF NEW.role = 'marketing' THEN INSERT IGNORE INTO marketing_profiles (userId) VALUES (NEW.id); END IF;
      END IF;
    END`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS \`TRG_users_role_profiles_update\``);
    await queryRunner.query(`DROP TRIGGER IF EXISTS \`TRG_users_role_profiles_insert\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`support_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`super_admin_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`sales_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`marketing_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`dating_user_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`admin_profiles\``);
  }
}
