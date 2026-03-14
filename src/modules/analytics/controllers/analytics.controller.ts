import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { AnalyticsService } from '../services/analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  public async getOverview(): Promise<
    ReturnType<AnalyticsService['getOverview']>
  > {
    return this.analyticsService.getOverview();
  }

  @Get('revenue')
  public async getRevenue(): Promise<
    ReturnType<AnalyticsService['getRevenueTrend']>
  > {
    return this.analyticsService.getRevenueTrend();
  }

  @Get('traffic')
  public async getTraffic(): Promise<
    ReturnType<AnalyticsService['getTrafficSources']>
  > {
    return this.analyticsService.getTrafficSources();
  }

  @Get('demographics')
  public async getDemographics(): Promise<
    ReturnType<AnalyticsService['getDemographics']>
  > {
    return this.analyticsService.getDemographics();
  }
}
