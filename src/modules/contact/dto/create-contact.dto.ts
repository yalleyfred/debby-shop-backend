import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  public name: string;

  @IsEmail()
  public email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public subject?: string;

  @IsString()
  public message: string;
}
