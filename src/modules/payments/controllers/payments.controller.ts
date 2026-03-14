import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { User } from '../../auth/entities/user.entity';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';

@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  public async createIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: User,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return this.paymentsService.createPaymentIntent(dto, user.id);
  }

  /**
   * Stripe webhook endpoint.
   * Must be PUBLIC (no JWT) and bypass throttling so Stripe retries work.
   * Requires raw body access for signature verification.
   */
  @Post('webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  public async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'Raw body is not available. Ensure rawBody:true is set in NestFactory.create().',
      );
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
