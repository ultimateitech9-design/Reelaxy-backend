import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

// Reelaxy sells no subscription plans or boosts; only the wallet
// (/wallet/razorpay) takes payments. These routes stay so older pending
// payments can still be verified.
@Controller('payments/razorpay')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('membership')
  @UseGuards(AuthGuard('jwt'))
  membership(@Req() request: any) {
    return this.paymentsService.membership(request.user.userId);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  verifyPayment(
    @Req() request: any,
    @Body() body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string },
  ) {
    return this.paymentsService.verifyPayment(request.user.userId, body);
  }

  @Post('webhook')
  webhook(@Req() request: any, @Headers('x-razorpay-signature') signature?: string) {
    return this.paymentsService.handleWebhook(request.rawBody, request.body, signature);
  }
}
