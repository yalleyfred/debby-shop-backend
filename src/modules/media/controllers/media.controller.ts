import {
  BadRequestException,
  Controller,
  Body,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { UploadedMedia } from '../interfaces/media.interfaces';
import { CloudinaryService } from '../services/cloudinary.service';

class DeleteMediaRequest {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public publicIds: string[];
}

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MediaController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadSingle(
    @UploadedFile() file?: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadedMedia> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.cloudinaryService.uploadFile(file, folder);
  }

  @Post('upload-many')
  @UseInterceptors(FilesInterceptor('images', 5))
  public async uploadMultiple(
    @UploadedFiles() files?: Express.Multer.File[],
    @Query('folder') folder?: string,
  ): Promise<UploadedMedia[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.cloudinaryService.uploadFiles(files, folder);
  }

  @Post('cleanup')
  public async cleanupMedia(
    @Body() request: DeleteMediaRequest,
  ): Promise<{ deleted: string[]; notFound: string[] }> {
    return this.cloudinaryService.deleteResources(request.publicIds);
  }
}
