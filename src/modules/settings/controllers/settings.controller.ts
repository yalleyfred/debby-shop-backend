import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { SettingsService } from '../services/settings.service';
import {
  ShopSettingsResponse,
  UpsertPaymentMethodsDto,
  UpsertSettingsDto,
  UpsertShopSettingsDto,
} from '../dto/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  public async getSettings(): Promise<Record<string, unknown>> {
    return this.settingsService.getAllSettings();
  }

  @Put()
  public async saveSettings(
    @Body() dto: UpsertSettingsDto,
  ): Promise<Record<string, unknown>> {
    return this.settingsService.upsertSettings(dto.settings ?? []);
  }

  @Get('shop')
  public async getShopSettings(): Promise<ShopSettingsResponse> {
    return this.settingsService.getShopSettings();
  }

  @Put('shop')
  public async upsertShopSettings(
    @Body() dto: UpsertShopSettingsDto,
  ): Promise<ShopSettingsResponse> {
    return this.settingsService.upsertShopSettings(dto);
  }

  @Get('payment-methods')
  public async getPaymentMethods(): Promise<UpsertPaymentMethodsDto> {
    return this.settingsService.getPaymentMethods();
  }

  @Put('payment-methods')
  public async savePaymentMethods(
    @Body() dto: UpsertPaymentMethodsDto,
  ): Promise<UpsertPaymentMethodsDto> {
    return this.settingsService.upsertPaymentMethods(dto);
  }
}
