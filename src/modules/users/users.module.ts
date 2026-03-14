import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserPaymentMethod } from './entities/user-payment-method.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAddress, UserPaymentMethod]),
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
