import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from '../entities/contact-submission.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactSubmission)
    private readonly contactRepository: Repository<ContactSubmission>,
    private readonly emailService: EmailService,
  ) {}

  public async submitContact(
    dto: CreateContactDto,
  ): Promise<{ message: string; id: string }> {
    const submission = this.contactRepository.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
    });

    const saved = await this.contactRepository.save(submission);

    void this.emailService.sendContactNotification(
      dto.name,
      dto.email,
      dto.subject ?? 'No subject',
      dto.message,
    );

    return {
      message:
        'Your message has been received. We will get back to you shortly.',
      id: saved.id,
    };
  }
}
