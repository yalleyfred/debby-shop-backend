import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { ContactService } from '../services/contact.service';
import { CreateContactDto } from '../dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  public async submit(
    @Body() dto: CreateContactDto,
  ): Promise<{ message: string; id: string }> {
    return this.contactService.submitContact(dto);
  }
}
