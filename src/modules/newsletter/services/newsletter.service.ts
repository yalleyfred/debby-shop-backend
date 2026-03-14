import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';
import { SubscribeNewsletterDto } from '../dto/subscribe-newsletter.dto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepository: Repository<NewsletterSubscriber>,
    private readonly emailService: EmailService,
  ) {}

  public async subscribe(
    dto: SubscribeNewsletterDto,
  ): Promise<{ message: string }> {
    const existing = await this.subscriberRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          'This email is already subscribed to the newsletter',
        );
      }
      await this.subscriberRepository.update(existing.id, { isActive: true });
      void this.emailService.sendNewsletterConfirmation(dto.email);
      return { message: 'Successfully re-subscribed to the newsletter' };
    }

    const subscriber = this.subscriberRepository.create({ email: dto.email });
    await this.subscriberRepository.save(subscriber);

    void this.emailService.sendNewsletterConfirmation(dto.email);

    return { message: 'Successfully subscribed to the newsletter' };
  }
}
