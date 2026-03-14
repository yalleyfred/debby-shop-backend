import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../entities/app-setting.entity';
import {
  GeneralSettingsDto,
  SecuritySettingsDto,
  ShopSettingsResponse,
  UpsertPaymentMethodsDto,
  UpsertSettingDto,
  UpsertShopSettingsDto,
} from '../dto/settings.dto';

const PAYMENT_METHODS_KEY = 'payment_methods';
const GENERAL_SETTINGS_KEY = 'general_settings';
const SECURITY_SETTINGS_KEY = 'security_settings';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingRepository: Repository<AppSetting>,
  ) {}

  public async getAllSettings(): Promise<Record<string, unknown>> {
    const settings = await this.settingRepository.find();
    return settings.reduce<Record<string, unknown>>((acc, s) => {
      if (s.value === null || s.value === undefined) {
        acc[s.key] = null;
        return acc;
      }
      try {
        acc[s.key] = JSON.parse(s.value) as unknown;
      } catch {
        acc[s.key] = s.value;
      }
      return acc;
    }, {});
  }

  public async upsertSettings(
    items: UpsertSettingDto[],
  ): Promise<Record<string, unknown>> {
    await Promise.all(
      items.map((item) => this.upsertJsonSetting(item.key, item.value, '', '')),
    );
    return this.getAllSettings();
  }

  public async getPaymentMethods(): Promise<UpsertPaymentMethodsDto> {
    const record = await this.settingRepository.findOne({
      where: { key: PAYMENT_METHODS_KEY },
    });

    if (!record || !record.value) {
      return {
        stripeEnabled: false,
        stripePublicKey: '',
        paypalEnabled: false,
        paypalClientId: '',
        bankTransferEnabled: false,
        codEnabled: false,
      };
    }

    try {
      return JSON.parse(record.value) as UpsertPaymentMethodsDto;
    } catch {
      return {};
    }
  }

  public async upsertPaymentMethods(
    dto: UpsertPaymentMethodsDto,
  ): Promise<UpsertPaymentMethodsDto> {
    const existing = await this.settingRepository.findOne({
      where: { key: PAYMENT_METHODS_KEY },
    });
    const jsonValue = JSON.stringify(dto);

    if (existing) {
      await this.settingRepository.update(existing.id, { value: jsonValue });
    } else {
      const setting = this.settingRepository.create({
        key: PAYMENT_METHODS_KEY,
        value: jsonValue,
        label: 'Payment Methods Configuration',
        group: 'payments',
      });
      await this.settingRepository.save(setting);
    }

    return dto;
  }

  public async getShopSettings(): Promise<ShopSettingsResponse> {
    const [generalRecord, securityRecord] = await Promise.all([
      this.settingRepository.findOne({ where: { key: GENERAL_SETTINGS_KEY } }),
      this.settingRepository.findOne({
        where: { key: SECURITY_SETTINGS_KEY },
      }),
    ]);

    return {
      general: generalRecord?.value
        ? (JSON.parse(generalRecord.value) as GeneralSettingsDto)
        : null,
      security: securityRecord?.value
        ? (JSON.parse(securityRecord.value) as SecuritySettingsDto)
        : null,
    };
  }

  public async upsertShopSettings(
    dto: UpsertShopSettingsDto,
  ): Promise<ShopSettingsResponse> {
    const updates: Promise<void>[] = [];

    if (dto.general !== undefined) {
      updates.push(
        this.upsertJsonSetting(
          GENERAL_SETTINGS_KEY,
          dto.general,
          'General Settings',
          'general',
        ),
      );
    }

    if (dto.security !== undefined) {
      updates.push(
        this.upsertJsonSetting(
          SECURITY_SETTINGS_KEY,
          dto.security,
          'Security Settings',
          'security',
        ),
      );
    }

    await Promise.all(updates);
    return this.getShopSettings();
  }

  private async upsertJsonSetting(
    key: string,
    value: unknown,
    label: string,
    group: string,
  ): Promise<void> {
    const existing = await this.settingRepository.findOne({ where: { key } });
    const jsonValue = JSON.stringify(value);

    if (existing) {
      await this.settingRepository.update(existing.id, { value: jsonValue });
    } else {
      const setting = this.settingRepository.create({
        key,
        value: jsonValue,
        label,
        group,
      });
      await this.settingRepository.save(setting);
    }
  }
}
