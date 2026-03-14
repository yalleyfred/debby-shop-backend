import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { EmailTemplatesService } from '../services/email-templates.service';
import { UpdateEmailTemplateDto } from '../dto/email-template.dto';
import { EmailTemplate } from '../entities/email-template.entity';

@Controller('email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  public async listAll(): Promise<EmailTemplate[]> {
    return this.emailTemplatesService.listAll();
  }

  @Get(':id')
  public async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmailTemplate> {
    return this.emailTemplatesService.getById(id);
  }

  @Put(':id')
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    return this.emailTemplatesService.update(id, dto);
  }
}
