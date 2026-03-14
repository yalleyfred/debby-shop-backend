import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { NewsletterService } from '../services/newsletter.service';
import { SubscribeNewsletterDto } from '../dto/subscribe-newsletter.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  public async subscribe(
    @Body() dto: SubscribeNewsletterDto,
  ): Promise<{ message: string }> {
    return this.newsletterService.subscribe(dto);
  }
}
