import { IsOptional, IsString } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  public subject?: string;

  @IsOptional()
  @IsString()
  public htmlBody?: string;

  @IsOptional()
  @IsString()
  public textBody?: string;
}
