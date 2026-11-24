import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Coordinator } from '../coordinators/coordinator.entity';
import { CoinTransaction } from '../users/coin-transaction.entity';
import { PayoutAccount } from './payout-account.entity';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [TypeOrmModule.forFeature([PayoutAccount, User, Coordinator, CoinTransaction])],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
