import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { SupportModule } from './support/support.module';
import { HealthController } from './health.controller';
import { MessagesModule } from './messages/messages.module';
import { MatchesModule } from './matches/matches.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { ProfilePhotosModule } from './profile-photos/profile-photos.module';
import { ApiModule } from './api/api.module';
import { KycModule } from './kyc/kyc.module';
import { SearchModule } from './search/search.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { DivorcedModule } from './divorced/divorced.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PlansModule } from './plans/plans.module';
import { WebrtcModule } from './webrtc/webrtc.module';
import { CoordinatorsModule } from './coordinators/coordinators.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StaffActivityInterceptor } from './common/staff-activity.interceptor';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ?? 'root',
      database: process.env.DB_NAME || 'reelaxy',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      // Production releases must apply pending schema changes before accepting traffic.
      // TYPEORM_MIGRATIONS_RUN remains available for explicitly enabling this locally.
      migrationsRun:
        process.env.NODE_ENV === 'production'
        || process.env.TYPEORM_MIGRATIONS_RUN === 'true',
      synchronize: false,
      logging: false,
      extra: {
        connectionLimit: parseInt(process.env.DB_POOL_MAX || '30', 10),
        waitForConnections: true,
        queueLimit: parseInt(process.env.DB_POOL_QUEUE_LIMIT || '0', 10),
      },
    }),
    AuthModule,
    UsersModule,
    AdminModule,
    SupportModule,
    MessagesModule,
    MatchesModule,
    DiscoveryModule,
    ProfilePhotosModule,
    ApiModule,
    KycModule,
    SearchModule,
    ChatbotModule,
    DivorcedModule,
    PushNotificationsModule,
    PaymentsModule,
    WebrtcModule,
    PlansModule,
    CoordinatorsModule,
  ],
  controllers: [HealthController],
  // Every staff change (create/update/delete) is written to the activity log under that staff member.
  providers: [{ provide: APP_INTERCEPTOR, useClass: StaffActivityInterceptor }],
})
export class AppModule {}
