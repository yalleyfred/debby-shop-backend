import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { OrderPayment } from '../orders/entities/order-payment.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([OrderPayment, Order])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
