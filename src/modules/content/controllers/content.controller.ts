import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { ContentService } from '../services/content.service';
import {
  CreateFaqDto,
  UpdateFaqDto,
  UpsertPageDto,
  UpsertSeoDto,
  UpsertPolicyDto,
} from '../dto/content.dto';
import { Page } from '../entities/page.entity';
import { Faq } from '../entities/faq.entity';
import { SeoSettings } from '../entities/seo-settings.entity';
import { PolicyContent, PolicyType } from '../entities/policy-content.entity';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ─── Static/fixed routes first (must come before parameterized :slug) ──────

  @Get('pages')
  @Public()
  public async listPages(): Promise<Page[]> {
    return this.contentService.listPages();
  }

  @Get('faqs')
  @Public()
  public async listFaqs(): Promise<Faq[]> {
    return this.contentService.listFaqs();
  }

  @Post('faqs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  public async createFaq(@Body() dto: CreateFaqDto): Promise<Faq> {
    return this.contentService.createFaq(dto);
  }

  @Patch('faqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  public async updateFaq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaqDto,
  ): Promise<Faq> {
    return this.contentService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  public async deleteFaq(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.contentService.deleteFaq(id);
  }

  @Put('seo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  public async upsertSeo(@Body() dto: UpsertSeoDto): Promise<SeoSettings> {
    return this.contentService.upsertSeoSettings(dto);
  }

  // ─── Policy routes ───────────────────────────────────────────────────────

  @Get('policies')
  @Public()
  public async listPolicies(): Promise<PolicyContent[]> {
    return await this.contentService.listPolicies();
  }

  @Get('policies/payment-delivery-terms')
  @Public()
  public async getPaymentDeliveryTerms(): Promise<PolicyContent | null> {
    return await this.contentService.getPolicy(
      PolicyType.PAYMENT_DELIVERY_TERMS,
    );
  }

  @Put('policies/payment-delivery-terms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  public async upsertPaymentDeliveryTerms(
    @Body() dto: UpsertPolicyDto,
  ): Promise<PolicyContent> {
    return await this.contentService.upsertPolicy(
      PolicyType.PAYMENT_DELIVERY_TERMS,
      dto,
    );
  }

  @Get('policies/returns-exchanges')
  @Public()
  public async getReturnsExchanges(): Promise<PolicyContent | null> {
    return await this.contentService.getPolicy(PolicyType.RETURNS_EXCHANGES);
  }

  @Put('policies/returns-exchanges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  public async upsertReturnsExchanges(
    @Body() dto: UpsertPolicyDto,
  ): Promise<PolicyContent> {
    return await this.contentService.upsertPolicy(
      PolicyType.RETURNS_EXCHANGES,
      dto,
    );
  }

  // ─── Parameterized routes last ───────────────────────────────────────────

  @Get(':slug')
  @Public()
  public async getPage(@Param('slug') slug: string): Promise<Page> {
    return this.contentService.getPageBySlug(slug);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  public async upsertPage(
    @Param('slug') slug: string,
    @Body() dto: UpsertPageDto,
  ): Promise<Page> {
    return this.contentService.upsertPage(slug, dto);
  }
}
