import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { APP_CONFIG } from '../../../shared/constants/app.constants';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import {
  OrderPayment,
  PaymentStatus,
} from '../../orders/entities/order-payment.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentRepository: Repository<OrderPayment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    const secretKey = this.configService.get<string>(
      APP_CONFIG.STRIPE_SECRET_KEY,
    );
    if (!secretKey) {
      throw new InternalServerErrorException(
        'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in your environment.',
      );
    }

    this.webhookSecret =
      this.configService.get<string>(APP_CONFIG.STRIPE_WEBHOOK_SECRET) ?? '';

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  public async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    userId: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const metadata: Record<string, string> = { userId };
      if (dto.orderId) {
        metadata['orderId'] = dto.orderId;
      }

      const intent = await this.stripe.paymentIntents.create({
        amount: dto.amount,
        currency: dto.currency.toLowerCase(),
        description: dto.description,
        metadata,
        automatic_payment_methods: { enabled: true },
      });

      if (!intent.client_secret) {
        throw new InternalServerErrorException(
          'Stripe did not return a client secret',
        );
      }

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new InternalServerErrorException(
          `Stripe error: ${error.message}`,
        );
      }
      throw error;
    }
  }

  public async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException(
        'Stripe webhook secret is not configured',
      );
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${String(err)}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.onPaymentFailed(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async onPaymentSucceeded(
    intent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.orderPaymentRepository.findOne({
      where: { token: intent.id },
      relations: { order: true },
    });

    if (!payment) {
      this.logger.warn(
        `No OrderPayment found for paymentIntentId: ${intent.id}`,
      );
      return;
    }

    await this.orderPaymentRepository.update(payment.id, {
      status: PaymentStatus.PAID,
    });

    await this.orderRepository.update(payment.order.id, {
      status: OrderStatus.PROCESSING,
    });

    this.logger.log(`Payment succeeded for order ${payment.order.id}`);
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.orderPaymentRepository.findOne({
      where: { token: intent.id },
    });

    if (!payment) {
      this.logger.warn(
        `No OrderPayment found for paymentIntentId: ${intent.id}`,
      );
      return;
    }

    await this.orderPaymentRepository.update(payment.id, {
      status: PaymentStatus.FAILED,
    });

    this.logger.log(`Payment failed for paymentIntentId: ${intent.id}`);
  }
}
