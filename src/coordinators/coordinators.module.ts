import { Module } from '@nestjs/common';
import { PayoutsModule } from '../payouts/payouts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { Coordinator, CoordinatorEmailChallenge } from './coordinator.entity';
import { CoordinatorGuard } from './coordinator.guard';
import { CoordinatorsController } from './coordinators.controller';
import { CoordinatorsService } from './coordinators.service';
import { UserActivityService } from '../users/user-activity.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coordinator, CoordinatorEmailChallenge, User]), AuthModule, MessagesModule, PayoutsModule],
  controllers: [CoordinatorsController], providers: [CoordinatorsService, CoordinatorGuard, UserActivityService],
})
export class CoordinatorsModule {}
