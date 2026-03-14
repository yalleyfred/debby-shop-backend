import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../entities/page.entity';
import { Faq } from '../entities/faq.entity';
import { SeoSettings } from '../entities/seo-settings.entity';
import { PolicyContent, PolicyType } from '../entities/policy-content.entity';
import {
  UpsertPageDto,
  CreateFaqDto,
  UpdateFaqDto,
  UpsertSeoDto,
  UpsertPolicyDto,
} from '../dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
    @InjectRepository(SeoSettings)
    private readonly seoRepository: Repository<SeoSettings>,
    @InjectRepository(PolicyContent)
    private readonly policyRepository: Repository<PolicyContent>,
  ) {}

  public async listPages(): Promise<Page[]> {
    return this.pageRepository.find({ order: { updatedAt: 'DESC' } });
  }

  public async getPageBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepository.findOne({ where: { slug } });
    if (!page) {
      throw new NotFoundException(`Page with slug '${slug}' not found`);
    }
    return page;
  }

  public async upsertPage(slug: string, dto: UpsertPageDto): Promise<Page> {
    let page = await this.pageRepository.findOne({ where: { slug } });

    if (page) {
      await this.pageRepository.update(page.id, { ...dto });
      page = await this.pageRepository.findOne({ where: { slug } });
      return page!;
    }

    const newPage = this.pageRepository.create({ slug, ...dto });
    return this.pageRepository.save(newPage);
  }

  public async listFaqs(): Promise<Faq[]> {
    return this.faqRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  public async createFaq(dto: CreateFaqDto): Promise<Faq> {
    const faq = this.faqRepository.create(dto);
    return this.faqRepository.save(faq);
  }

  public async updateFaq(id: string, dto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }
    await this.faqRepository.update(id, dto);
    return this.faqRepository.findOne({ where: { id } }) as Promise<Faq>;
  }

  public async deleteFaq(id: string): Promise<{ message: string }> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }
    await this.faqRepository.delete(id);
    return { message: 'FAQ deleted successfully' };
  }

  public async getSeoSettings(): Promise<SeoSettings | null> {
    const [settings] = await this.seoRepository.find({ take: 1 });
    return settings ?? null;
  }

  public async upsertSeoSettings(dto: UpsertSeoDto): Promise<SeoSettings> {
    const [existing] = await this.seoRepository.find({ take: 1 });

    if (existing) {
      await this.seoRepository.update(existing.id, dto);
      return this.seoRepository.findOne({
        where: { id: existing.id },
      }) as Promise<SeoSettings>;
    }

    const settings = this.seoRepository.create(dto);
    return this.seoRepository.save(settings);
  }

  public async listPolicies(): Promise<PolicyContent[]> {
    return this.policyRepository.find({ order: { type: 'ASC' } });
  }

  public async getPolicy(type: PolicyType): Promise<PolicyContent | null> {
    return this.policyRepository.findOne({ where: { type } });
  }

  public async upsertPolicy(
    type: PolicyType,
    dto: UpsertPolicyDto,
  ): Promise<PolicyContent> {
    const existing = await this.policyRepository.findOne({ where: { type } });

    if (existing) {
      await this.policyRepository.update(existing.id, { ...dto });
      return this.policyRepository.findOne({
        where: { id: existing.id },
      }) as Promise<PolicyContent>;
    }

    const policy = this.policyRepository.create({ type, ...dto });
    return this.policyRepository.save(policy);
  }
}
