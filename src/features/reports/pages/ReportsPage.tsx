import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { customerTypes } from '@/features/customers'
import { leadStatusTone, leadStatuses } from '@/features/leads'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { KpiCard, KpiGrid, PageHeader, Select } from '@/shared/ui'
import { BarChart, ChartCard, DoughnutChart, useChartTheme } from '@/shared/ui/charts'
import { reportPeriods, useReportData, type ReportPeriod } from '../hooks/useReportData'

export function ReportsPage() {
  const { t } = useTranslation()
  const { formatMoney, formatMoneyCompact, formatMonth, formatNumber, formatPercent } = useFormatters()
  const chartTheme = useChartTheme()
  const [period, setPeriod] = useState<ReportPeriod>('ytd')
  const report = useReportData(period)

  const placeholder = report.isLoading ? '…' : undefined
  const state = { isLoading: report.isLoading, error: report.error }

  return (
    <section>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <Select
            aria-label={t('reports.period')}
            value={period}
            onChange={(value) => setPeriod(value as ReportPeriod)}
            options={reportPeriods.map((p) => ({ value: p, label: t(`reports.periods.${p}`) }))}
          />
        }
      />

      <KpiGrid columns={4}>
        <KpiCard
          icon="bi-currency-euro"
          label={t('reports.kpis.revenue')}
          value={placeholder ?? formatMoney(report.kpis.revenue)}
        />
        <KpiCard
          icon="bi-receipt"
          label={t('reports.kpis.orders')}
          value={placeholder ?? formatNumber(report.kpis.orderCount)}
        />
        <KpiCard
          icon="bi-basket"
          label={t('reports.kpis.averageOrder')}
          value={placeholder ?? formatMoney(report.kpis.averageOrderValue)}
        />
        <KpiCard
          icon="bi-x-circle"
          label={t('reports.kpis.cancellationRate')}
          value={placeholder ?? formatPercent(report.kpis.cancellationRate)}
        />
      </KpiGrid>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <ChartCard title={t('reports.charts.revenueByMonth')} size="lg" {...state}>
            <BarChart
              ariaLabel={t('reports.charts.revenueByMonth')}
              labels={report.months.map(formatMonth)}
              series={[{ label: t('reports.kpis.revenue'), data: report.revenueByMonth }]}
              formatValue={formatMoneyCompact}
            />
          </ChartCard>
        </div>
        <div className="col-12 col-xl-4">
          <ChartCard
            title={t('reports.charts.revenueByCustomerType')}
            size="lg"
            {...state}
            isEmpty={!report.kpis.revenue}
          >
            <DoughnutChart
              ariaLabel={t('reports.charts.revenueByCustomerType')}
              labels={customerTypes.map((type) => t(`customers.types.${type}`))}
              data={report.revenueByCustomerType}
              formatValue={formatMoney}
            />
          </ChartCard>
        </div>

        <div className="col-12 col-lg-6">
          <ChartCard title={t('reports.charts.topProducts')} size="lg" {...state} isEmpty={!report.topProducts.length}>
            <BarChart
              horizontal
              ariaLabel={t('reports.charts.topProducts')}
              labels={report.topProducts.map((p) => p.label)}
              series={[{ label: t('reports.kpis.revenue'), data: report.topProducts.map((p) => p.value) }]}
              formatValue={formatMoneyCompact}
            />
          </ChartCard>
        </div>
        <div className="col-12 col-lg-6">
          <ChartCard title={t('reports.charts.topCities')} size="lg" {...state} isEmpty={!report.topCities.length}>
            <BarChart
              horizontal
              ariaLabel={t('reports.charts.topCities')}
              labels={report.topCities.map((c) => c.label)}
              series={[
                { label: t('reports.kpis.revenue'), data: report.topCities.map((c) => c.value), color: chartTheme.series[1] },
              ]}
              formatValue={formatMoneyCompact}
            />
          </ChartCard>
        </div>

        <div className="col-12 col-lg-7">
          <ChartCard
            title={t('reports.charts.pipeline')}
            subtitle={t('reports.charts.pipelineHint', { leads: report.leadCount })}
            {...state}
            isEmpty={!report.leadCount}
          >
            <BarChart
              ariaLabel={t('reports.charts.pipeline')}
              labels={leadStatuses.map((s) => t(`leads.status.${s}`))}
              series={[
                {
                  label: t('reports.charts.estimatedValue'),
                  data: report.pipelineByStatus,
                  color: leadStatuses.map((s) => chartTheme.tones[leadStatusTone[s]]),
                },
              ]}
              formatValue={formatMoneyCompact}
            />
          </ChartCard>
        </div>
        <div className="col-12 col-lg-5">
          <ChartCard title={t('reports.charts.leadSources')} {...state} isEmpty={!report.leadCount}>
            <DoughnutChart
              ariaLabel={t('reports.charts.leadSources')}
              labels={report.leadsBySource.map((s) => s.label)}
              data={report.leadsBySource.map((s) => s.value)}
              formatValue={formatNumber}
            />
          </ChartCard>
        </div>
      </div>
    </section>
  )
}
