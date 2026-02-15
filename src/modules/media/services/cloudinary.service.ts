import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { APP_CONFIG } from '../../../shared/constants/app.constants';
import { UploadedMedia } from '../interfaces/media.interfaces';

@Injectable()
export class CloudinaryService {
  private readonly rootFolder: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>(
      APP_CONFIG.CLOUDINARY_CLOUD_NAME,
    );
    const apiKey = this.configService.get<string>(APP_CONFIG.CLOUDINARY_API_KEY);
    const apiSecret = this.configService.get<string>(
      APP_CONFIG.CLOUDINARY_API_SECRET,
    );

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary configuration is missing',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.rootFolder =
      this.configService.get<string>(APP_CONFIG.CLOUDINARY_FOLDER) ??
      'debby-shop';
  }

  public async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadedMedia> {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const fullFolder = folder
      ? `${this.rootFolder}/${folder}`
      : `${this.rootFolder}/general`;

    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: fullFolder,
        resource_type: 'auto',
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch {
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  public async uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadedMedia[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  public async deleteResources(publicIds: string[]): Promise<{
    deleted: string[];
    notFound: string[];
  }> {
    if (publicIds.length === 0) {
      return { deleted: [], notFound: [] };
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image',
      });

      const deleted = Object.entries(result.deleted ?? {})
        .filter(([, status]) => status === 'deleted')
        .map(([publicId]) => publicId);

      const notFound = Object.entries(result.deleted ?? {})
        .filter(([, status]) => status !== 'deleted')
        .map(([publicId]) => publicId);

      return { deleted, notFound };
    } catch {
      throw new InternalServerErrorException('Failed to delete media resources');
    }
  }
}
