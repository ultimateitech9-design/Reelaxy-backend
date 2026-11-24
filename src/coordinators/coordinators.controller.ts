import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PayoutInput, PayoutsService, WithdrawalRequest } from '../payouts/payouts.service';
import { CoordinatorGuard } from './coordinator.guard';
import { CoordinatorBulkUsersDto, CoordinatorEmailDto, CoordinatorLoginDto, CoordinatorPhotoDto, CoordinatorRegisterDto, CoordinatorResetDto, CoordinatorUsersQueryDto } from './coordinators.dto';
import { CoordinatorsService } from './coordinators.service';

@Controller('coordinators')
export class CoordinatorsController {
  constructor(private readonly service: CoordinatorsService, private readonly payouts: PayoutsService) {}
  @Post('auth/signup-otp') requestSignup(@Body() body: CoordinatorEmailDto, @Req() req: any) { this.service.throttle(`email:${req.ip}`, 15); return this.service.sendCode(body.email, 'signup'); }
  @Post('auth/register') register(@Body() body: CoordinatorRegisterDto, @Req() req: any) { this.service.throttle(`verify:${req.ip}`, 20); return this.service.register(body); }
  @Post('auth/login') @HttpCode(200) login(@Body() body: CoordinatorLoginDto, @Req() req: any) { this.service.throttle(`login:${req.ip}:${body.email}`, 10); return this.service.login(body); }
  @Post('auth/forgot-password') requestReset(@Body() body: CoordinatorEmailDto, @Req() req: any) { this.service.throttle(`email:${req.ip}`, 15); return this.service.sendCode(body.email, 'reset'); }
  @Post('auth/reset-password') reset(@Body() body: CoordinatorResetDto, @Req() req: any) { this.service.throttle(`verify:${req.ip}`, 20); return this.service.reset(body); }
  @Get('me') @UseGuards(CoordinatorGuard) me(@Req() req: any) { return { coordinator: this.service.publicCoordinator(req.coordinator) }; }
  @Post('auth/logout') @UseGuards(CoordinatorGuard) logout(@Req() req: any) { return this.service.logout(req.coordinator.id); }
  @Get('earnings') @UseGuards(CoordinatorGuard) earnings(@Req() req: any) { return this.service.earnings(req.coordinator.id); }
  @Get('payout-accounts') @UseGuards(CoordinatorGuard) payoutAccounts(@Req() req: any) { return this.payouts.listAccounts('coordinator', req.coordinator.id); }
  @Post('payout-accounts') @UseGuards(CoordinatorGuard) createPayoutAccount(@Req() req: any, @Body() body: PayoutInput) { return this.payouts.createAccount('coordinator', req.coordinator.id, body); }
  @Patch('payout-accounts/:id') @UseGuards(CoordinatorGuard) updatePayoutAccount(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() body: PayoutInput) { return this.payouts.updateAccount('coordinator', req.coordinator.id, id, body); }
  @Delete('payout-accounts/:id') @UseGuards(CoordinatorGuard) deletePayoutAccount(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.payouts.deleteAccount('coordinator', req.coordinator.id, id); }
  @Get('withdrawals') @UseGuards(CoordinatorGuard) withdrawals(@Req() req: any) { return this.payouts.withdrawals('coordinator', req.coordinator.id); }
  @Post('withdrawals') @UseGuards(CoordinatorGuard) withdraw(@Req() req: any, @Body() body: WithdrawalRequest) { this.service.throttle(`withdraw:${req.coordinator.id}`, 10); return this.payouts.requestWithdrawal('coordinator', req.coordinator.id, body); }
  @Get('users') @UseGuards(CoordinatorGuard) users(@Req() req: any, @Query() query: CoordinatorUsersQueryDto) { return this.service.listUsers(req.coordinator.id, query); }
  @Get('users/export') @UseGuards(CoordinatorGuard) exportUsers(@Req() req: any, @Query('cursor') cursor?: string) { return this.service.exportUsers(req.coordinator.id, cursor); }
  @Get('users/:id') @UseGuards(CoordinatorGuard) user(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.service.userDetails(req.coordinator.id, id); }
  @Get('users/:id/activity') @UseGuards(CoordinatorGuard) activity(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Query('page') page?: string) { return this.service.userActivity(req.coordinator.id, id, Number(page || 1)); }
  @Post('users/:id/ban') @UseGuards(CoordinatorGuard) ban(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.service.moderateUser(req.coordinator.id, id, 'ban'); }
  @Post('users/:id/delete') @UseGuards(CoordinatorGuard) delete(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.service.moderateUser(req.coordinator.id, id, 'delete'); }
  @Post('users/:id/photo') @UseGuards(CoordinatorGuard) updatePhoto(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() body: CoordinatorPhotoDto) { this.service.throttle(`photo:${req.coordinator.id}`, 30); return this.service.updatePhoto(req.coordinator.id, id, body.photo); }
  @Post('users/bulk') @UseGuards(CoordinatorGuard) createUsers(@Req() req: any, @Body() body: CoordinatorBulkUsersDto) { this.service.throttle(`create:${req.coordinator.id}`, 15); return this.service.createUsers(req.coordinator.id, body); }
}
