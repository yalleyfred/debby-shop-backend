import { IsEmail } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail()
  public email: string;
}
