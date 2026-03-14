import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { UserRole } from '../../auth/interfaces/auth.interfaces';
import { OrderAddressType } from '../../orders/entities/order-address.entity';

type AllTimeTotals = {
  totalOrders: string;
  totalRevenue: string;
  averageOrderValue: string;
};

type PeriodStats = { orders: string; revenue: string };

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async getOverview(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueGrowth: number;
    ordersGrowth: number;
    averageOrderValue: number;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totals,
      currentPeriod,
      previousPeriod,
      totalCustomers,
      totalProducts,
    ] = await Promise.all([
      this.getAllTimeTotals(),
      this.getPeriodStats(thirtyDaysAgo),
      this.getPeriodStats(sixtyDaysAgo, thirtyDaysAgo),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.productRepository.count(),
    ]);

    const allTime = this.parseTotals(totals);
    const current = this.parsePeriodStats(currentPeriod);
    const previous = this.parsePeriodStats(previousPeriod);

    return {
      totalRevenue: Math.round(allTime.totalRevenue * 100) / 100,
      totalOrders: allTime.totalOrders,
      totalCustomers,
      totalProducts,
      revenueGrowth: this.calcGrowth(current.revenue, previous.revenue),
      ordersGrowth: this.calcGrowth(current.orders, previous.orders),
      averageOrderValue: Math.round(allTime.averageOrderValue * 100) / 100,
    };
  }

  public async getRevenueTrend(): Promise<{
    labels: string[];
    data: number[];
    period: string;
  }> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select(`TO_CHAR(DATE_TRUNC('month', o.createdAt), 'YYYY-MM')`, 'month')
      .addSelect('COALESCE(SUM(o.total::numeric), 0)', 'revenue')
      .where(`o.status != :cancelled`, { cancelled: OrderStatus.CANCELLED })
      .andWhere('o.createdAt >= :since', { since: twelveMonthsAgo })
      .groupBy(`DATE_TRUNC('month', o.createdAt)`)
      .orderBy(`DATE_TRUNC('month', o.createdAt)`, 'ASC')
      .getRawMany<{ month: string; revenue: string }>();

    const revenueByMonth: Record<string, number> = {};
    for (const row of rows) {
      revenueByMonth[row.month] =
        Math.round(parseFloat(row.revenue) * 100) / 100;
    }

    const { labels, data } = this.buildLastTwelveMonths(revenueByMonth);

    return { labels, data, period: 'last_12_months' };
  }

  public async getTrafficSources(): Promise<{
    sources: Array<{
      source: string;
      label: string;
      percentage: number;
      count: number;
    }>;
  }> {
    const SOURCE_LABELS: Record<string, string> = {
      direct: 'Direct',
      organic: 'Organic Search',
      social: 'Social Media',
      referral: 'Referral',
      email: 'Email',
    };

    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select(`COALESCE(LOWER(o.trafficSource), 'direct')`, 'source')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy(`COALESCE(LOWER(o.trafficSource), 'direct')`)
      .orderBy('count', 'DESC')
      .getRawMany<{ source: string; count: string }>();

    const total = rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    if (total === 0) {
      return {
        sources: Object.keys(SOURCE_LABELS).map((source) => ({
          source,
          label: SOURCE_LABELS[source] ?? source,
          percentage: 0,
          count: 0,
        })),
      };
    }

    return {
      sources: rows.map((r) => ({
        source: r.source,
        label: SOURCE_LABELS[r.source] ?? r.source,
        count: parseInt(r.count),
        percentage: Math.round((parseInt(r.count) / total) * 100 * 10) / 10,
      })),
    };
  }

  public async getDemographics(): Promise<{
    regions: Array<{ region: string; count: number; percentage: number }>;
    newVsReturning: { new: number; returning: number };
  }> {
    const [regionRows, totalOrders, totalCustomers, returningCount] =
      await Promise.all([
        this.orderRepository
          .createQueryBuilder('o')
          .innerJoin('o.addresses', 'a')
          .select('a.country', 'country')
          .addSelect('COUNT(o.id)', 'count')
          .where('a.type = :type', { type: OrderAddressType.SHIPPING })
          .groupBy('a.country')
          .orderBy('count', 'DESC')
          .limit(10)
          .getRawMany<{ country: string; count: string }>(),
        this.orderRepository.count(),
        this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
        this.orderRepository
          .createQueryBuilder('o')
          .select('o.customerId')
          .groupBy('o.customerId')
          .having('COUNT(o.id) > 1')
          .getCount(),
      ]);

    const total = totalOrders || 1;
    const regions = regionRows.map(({ country, count }) => ({
      region: country,
      count: parseInt(count),
      percentage: Math.round((parseInt(count) / total) * 100 * 10) / 10,
    }));

    const returning = Math.min(returningCount, totalCustomers);

    return {
      regions,
      newVsReturning: {
        new: Math.max(0, totalCustomers - returning),
        returning,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getAllTimeTotals(): Promise<AllTimeTotals | undefined> {
    return this.orderRepository
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'totalOrders')
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.status != :cancelled THEN o.total::numeric ELSE 0 END), 0)`,
        'totalRevenue',
      )
      .addSelect(
        `COALESCE(AVG(CASE WHEN o.status != :cancelled THEN o.total::numeric END), 0)`,
        'averageOrderValue',
      )
      .setParameter('cancelled', OrderStatus.CANCELLED)
      .getRawOne<AllTimeTotals>();
  }

  private async getPeriodStats(
    start: Date,
    end?: Date,
  ): Promise<PeriodStats | undefined> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'orders')
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.status != :cancelled THEN o.total::numeric ELSE 0 END), 0)`,
        'revenue',
      )
      .setParameter('cancelled', OrderStatus.CANCELLED);

    if (end) {
      qb.where('o.createdAt >= :start AND o.createdAt < :end', { start, end });
    } else {
      qb.where('o.createdAt >= :start', { start });
    }

    return qb.getRawOne<PeriodStats>();
  }

  private calcGrowth(current: number, previous: number): number {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  private parseTotals(raw: AllTimeTotals | undefined): {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  } {
    return {
      totalRevenue: parseFloat(raw?.totalRevenue ?? '0'),
      totalOrders: parseInt(raw?.totalOrders ?? '0'),
      averageOrderValue: parseFloat(raw?.averageOrderValue ?? '0'),
    };
  }

  private parsePeriodStats(raw: PeriodStats | undefined): {
    revenue: number;
    orders: number;
  } {
    return {
      revenue: parseFloat(raw?.revenue ?? '0'),
      orders: parseInt(raw?.orders ?? '0'),
    };
  }

  private buildLastTwelveMonths(revenueByMonth: Record<string, number>): {
    labels: string[];
    data: number[];
  } {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
      data.push(revenueByMonth[key] ?? 0);
    }

    return { labels, data };
  }
}
