import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductServiceImpl } from './services/product.service';
import { ProductRepositoryImpl } from './repositories/product.repository';
import { ProductController } from './controllers/product.controller';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuthModule, MediaModule],
  controllers: [ProductController],
  providers: [ProductServiceImpl, ProductRepositoryImpl],
  exports: [ProductServiceImpl, ProductRepositoryImpl],
})
export class ProductModule {}
