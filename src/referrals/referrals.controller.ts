import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferralsService } from './referrals.service';

@UseGuards(AuthGuard('jwt'))
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  mine(@Request() req: any) {
    return this.referrals.mine(req.user.userId);
  }
}
