import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { UpdateEmailTemplateDto } from '../dto/email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepository: Repository<EmailTemplate>,
  ) {}

  public async getById(id: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Email template with ID '${id}' not found`);
    }
    return template;
  }

  public async update(
    id: string,
    dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.getById(id);
    await this.templateRepository.update(template.id, dto);
    return this.getById(id);
  }

  public async listAll(): Promise<EmailTemplate[]> {
    return this.templateRepository.find({ order: { name: 'ASC' } });
  }
}
