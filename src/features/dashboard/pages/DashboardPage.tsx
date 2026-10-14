import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import {
  OrdersTable,
  countByStatus,
  orderStatusTone,
  orderStatuses,
  revenueByMonth,
  useOrderRows,
  useOrders,
} from '@/features/orders'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { lastMonthKeys } from '@/shared/lib/months'
import { KpiCard, KpiGrid, PageHeader } from '@/shared/ui'
import { ChartCard, DoughnutChart, LineChart, useChartTheme } from '@/shared/ui/charts'
import { useDashboardStats } from '../hooks/useDashboardStats'

const RECENT_ORDERS = 5
const TREND_MONTHS = 6

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { formatMoney, formatMoneyCompact, formatMonth, formatNumber } = useFormatters()
  const chartTheme = useChartTheme()
  const stats = useDashboardStats()
  const orders = useOrders()
  const recent = useOrderRows()

  const placeholder = stats.isLoading ? '…' : undefined
  const months = lastMonthKeys(TREND_MONTHS)
  const statusCounts = countByStatus(orders.data ?? [])

  return (
    <section>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle', { name: user?.name.split(' ')[0] ?? '' })}
      />

      <KpiGrid>
        <KpiCard icon="bi-currency-euro" label={t('dashboard.revenue')} value={placeholder ?? formatMoney(stats.revenue)} />
        <KpiCard icon="bi-receipt" label={t('dashboard.orders')} value={placeholder ?? formatNumber(stats.orderCount)} />
        <KpiCard
          icon="bi-building"
          label={t('dashboard.activeCustomers')}
          value={placeholder ?? formatNumber(stats.activeCustomers)}
        />
        <KpiCard
          icon="bi-funnel"
          label={t('dashboard.openLeads')}
          value={placeholder ?? formatNumber(stats.openLeads)}
          hint={placeholder ? undefined : t('dashboard.pipeline', { value: formatMoney(stats.pipelineValue) })}
        />
        <KpiCard
          icon="bi-exclamation-triangle"
          tone={stats.lowStockProducts > 0 ? 'danger' : 'neutral'}
          label={t('dashboard.lowStock')}
          value={placeholder ?? formatNumber(stats.lowStockProducts)}
          hint={t('dashboard.lowStockHint', { threshold: stats.lowStockThreshold })}
        />
      </KpiGrid>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title={t('dashboard.revenueTrend')}
            subtitle={t('dashboard.lastMonths', { months: TREND_MONTHS })}
            isLoading={orders.isLoading}
            error={orders.error}
          >
            <LineChart
              ariaLabel={t('dashboard.revenueTrend')}
              labels={months.map(formatMonth)}
              series={[{ label: t('dashboard.revenue'), data: revenueByMonth(orders.data ?? [], months) }]}
              formatValue={formatMoneyCompact}
            />
          </ChartCard>
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <ChartCard
            title={t('dashboard.ordersByStatus')}
            isLoading={orders.isLoading}
            error={orders.error}
            isEmpty={!orders.data?.length}
          >
            <DoughnutChart
              ariaLabel={t('dashboard.ordersByStatus')}
              labels={orderStatuses.map((s) => t(`orders.status.${s}`))}
              data={orderStatuses.map((s) => statusCounts[s])}
              colors={orderStatuses.map((s) => chartTheme.tones[orderStatusTone[s]])}
              formatValue={formatNumber}
            />
          </ChartCard>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h6 fw-semibold mb-0">{t('dashboard.recentOrders')}</h2>
        <Link to="/orders" className="small fw-medium text-decoration-none">
          {t('dashboard.viewAll')} <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      </div>
      <OrdersTable
        orders={recent.rows?.slice(0, RECENT_ORDERS)}
        isLoading={recent.isLoading}
        error={recent.error}
      />
    </section>
  )
}
