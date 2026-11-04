import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { activityTypes, type Activity, type ActivityType } from '@/features/calendar'
import { activityStyle } from '@/features/calendar/lib/activityStyle'
import { LeadStatusBadge } from '@/features/leads'
import { OrderStatusBadge } from '@/features/orders'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { KpiCard, KpiGrid, PageHeader } from '@/shared/ui'
import { BarChart, ChartCard } from '@/shared/ui/charts'
import { RouteMap } from '../components/RouteMap'
import { useRepHome } from '../hooks/useRepHome'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { formatDate, formatMonth, formatNumber, formatTime } = useFormatters()
  const home = useRepHome()
  const waiting = home.isLoading ? '…' : undefined
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
  const weekEmpty = home.weekBars.every((day) => activityTypes.every((type) => day.counts[type] === 0))
  const ordersEmpty = home.orderMonths.every((month) => month.count === 0)
  const activityColor = (type: ActivityType) => {
    const variable = activityStyle[type].color.slice(4, -1)
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  }

  return (
    <section>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle', { name: user?.name.split(' ')[0] ?? '' })} />

      {home.error && (
        <div className="alert alert-danger" role="alert">
          {t('common.error', { message: home.error.message })}
        </div>
      )}

      <KpiGrid columns={4}>
        <KpiCard
          icon="bi-signpost"
          label={t('dashboard.today')}
          value={waiting ?? (home.today.length === 0 ? formatNumber(0) : t('dashboard.todayValue', { done: formatNumber(home.todayDone), total: formatNumber(home.today.length) }))}
          hint={t('dashboard.todayHint', { done: waiting ?? formatNumber(home.todayDone) })}
        />
        <KpiCard
          icon="bi-calendar3"
          label={t('dashboard.weekKpi')}
          value={waiting ?? formatNumber(home.weekCount)}
          hint={t('dashboard.weekKpiHint')}
        />
        <KpiCard
          icon="bi-arrow-return-left"
          label={t('dashboard.followUps')}
          value={waiting ?? formatNumber(home.followUpCount)}
          hint={t('dashboard.followUpsHint')}
        />
        <KpiCard
          icon="bi-hourglass-split"
          tone={home.expiring.length > 0 ? 'warning' : 'neutral'}
          label={t('dashboard.expiringKpi')}
          value={waiting ?? formatNumber(home.expiring.length)}
          hint={t('dashboard.expiringKpiHint')}
        />
      </KpiGrid>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <Panel title={t('dashboard.mapTitle')} to="/map" action={t('dashboard.openMap')}>
            <RouteMap stops={home.stops} isLoading={home.isLoading} />
          </Panel>
        </div>
        <div className="col-12 col-xl-5">
          <ChartCard
            title={t('dashboard.weekChart')}
            subtitle={t('dashboard.weekChartHint')}
            size="md"
            isLoading={home.isLoading}
            error={home.error}
            isEmpty={!home.isLoading && !home.error && weekEmpty}
          >
            <BarChart
              labels={home.weekBars.map((day) => weekday.format(new Date(`${day.date}T12:00:00`)))}
              series={activityTypes.map((type) => ({
                label: t(`calendar.types.${type}`),
                data: home.weekBars.map((day) => day.counts[type]),
                color: activityColor(type),
              }))}
              stacked
              formatValue={(value) => formatNumber(value)}
              ariaLabel={t('dashboard.weekChart')}
            />
          </ChartCard>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <Panel title={t('dashboard.route')} to="/calendar" action={t('dashboard.openCalendar')}>
            {home.isLoading ? <Loading /> : home.today.length === 0 ? <p className={styles.empty}>{t('dashboard.routeEmpty')}</p> : (
              <ul className={styles.list}>
                {home.today.map((activity) => (
                  <li key={activity.id}>
                    <Stop activity={activity} name={home.nameOf(activity)} time={formatTime(activity.start)} done={activity.status === 'done'} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="col-12 col-xl-5">
          <Panel title={t('dashboard.followTitle')} to="/clm/feedback" action={t('dashboard.open')}>
            {home.isLoading ? <Loading /> : home.followUps.length === 0 ? <p className={styles.empty}>{t('dashboard.followEmpty')}</p> : (
              <ul className={styles.list}>
                {home.followUps.map((item) => (
                  <li key={item.id}>
                    <Link to="/clm/feedback" className={styles.row}>
                      <span className={styles.stack}>
                        <span className={styles.name}>{item.customerName}</span>
                        <span className={styles.note}>{item.productName}. {item.note}</span>
                      </span>
                      <span className={styles.aside}>{formatDate(item.endedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <Panel title={t('dashboard.ordersTitle')} to="/orders" action={t('dashboard.open')}>
            {home.isLoading ? <Loading /> : home.latestOrders.length === 0 ? <p className={styles.empty}>{t('dashboard.ordersEmpty')}</p> : (
              <>
                <p className={styles.more}>{t('dashboard.ordersHint', { open: formatNumber(home.openCount) })}</p>
                <ul className={styles.list}>
                  {home.latestOrders.map((order) => (
                    <li key={order.id}>
                      <Link to="/orders" className={styles.row}>
                        <span className={styles.stack}>
                          <span className={styles.name}>{order.customerName}</span>
                          <span className={styles.note}>{order.orderNumber} · {formatDate(order.orderDate)}</span>
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>
        <div className="col-12 col-xl-5">
          <ChartCard
            title={t('dashboard.ordersChart')}
            subtitle={t('dashboard.ordersChartHint')}
            size="md"
            isLoading={home.isLoading}
            error={home.error}
            isEmpty={!home.isLoading && !home.error && ordersEmpty}
          >
            <BarChart
              labels={home.orderMonths.map((month) => formatMonth(month.key))}
              series={[{ label: t('dashboard.ordersChart'), data: home.orderMonths.map((month) => month.count) }]}
              formatValue={(value) => formatNumber(value)}
              ariaLabel={t('dashboard.ordersChart')}
            />
          </ChartCard>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Panel title={t('dashboard.expiringTitle')} to="/clm" action={t('dashboard.open')}>
            {home.isLoading ? <Loading /> : home.expiring.length === 0 ? <p className={styles.empty}>{t('dashboard.expiringEmpty')}</p> : (
              <ul className={styles.list}>
                {home.expiring.map((deck) => (
                  <li key={deck.id}>
                    <Link to="/clm" className={styles.row}>
                      <span className={styles.name}>{deck.productName}</span>
                      <span className={styles.warn}>
                        {deck.days < 0 ? t('clm.expired') : t('clm.expiring', { days: deck.days })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="col-12 col-lg-6">
          <Panel title={t('dashboard.leadsTitle')} to="/leads" action={t('dashboard.open')}>
            {home.isLoading ? <Loading /> : home.nearbyLeads.length === 0 ? <p className={styles.empty}>{t('dashboard.leadsEmpty')}</p> : (
              <>
                <p className={styles.more}>{t('dashboard.leadsSummary', { count: formatNumber(home.nearbyCount) })}</p>
                <ul className={styles.list}>
                  {home.nearbyLeads.map((lead) => (
                    <li key={lead.id}>
                      <Link to="/leads" className={styles.row}>
                        <span className={styles.stack}>
                          <span className={styles.name}>{lead.companyName}</span>
                          <span className={styles.note}>{lead.city}</span>
                        </span>
                        <LeadStatusBadge status={lead.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </section>
  )
}

function Panel({ title, to, action, children }: { title: string; to: string; action: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <header className={styles.head}>
        <h2>{title}</h2>
        <Link to={to}>{action}</Link>
      </header>
      {children}
    </section>
  )
}

function Stop({ activity, name, time, done = false }: { activity: Activity; name: string; time: string; done?: boolean }) {
  const { t } = useTranslation()
  return (
    <Link to="/calendar" className={styles.stop}>
      <time className={styles.when} dateTime={activity.start}>
        <span>{time}</span>
      </time>
      <span className={styles.mark} style={{ background: done ? 'var(--bs-secondary-color)' : activityStyle[activity.type].color }} />
      <span className={styles.stack}>
        <span className={styles.name}>{name}</span>
        <span className={styles.meta}>
          {t(`calendar.types.${activity.type}`)}
          {done ? ` · ${t('dashboard.done')}` : ''}
          {activity.notes ? ` · ${activity.notes}` : ''}
        </span>
      </span>
    </Link>
  )
}

function Loading() {
  const { t } = useTranslation()
  return (
    <p className={styles.empty}>
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      {t('common.loading')}
    </p>
  )
}
