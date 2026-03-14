import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { Faq } from './entities/faq.entity';
import { SeoSettings } from './entities/seo-settings.entity';
import { PolicyContent } from './entities/policy-content.entity';
import { ContentService } from './services/content.service';
import { ContentController } from './controllers/content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Faq, SeoSettings, PolicyContent])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
