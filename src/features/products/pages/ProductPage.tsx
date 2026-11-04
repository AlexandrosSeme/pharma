import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { feedbackLines } from '@/features/clm/lib/feedback'
import { daysUntil, isExpired, isExpiring, localized } from '@/features/clm/lib/text'
import { useClmDecks, useClmSessions } from '@/features/clm/queries'
import { EXPIRING_WITHIN_DAYS, type ClmDeck } from '@/features/clm/types'
import { OrderStatusBadge, useOrders } from '@/features/orders'
import { localized as medText } from '@/features/regulatory/lib/text'
import { useMedications } from '@/features/regulatory/queries'
import { nameVisible, useVisibleCustomers } from '@/features/team'
import { useScope } from '@/features/team/useScope'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { StatusBadge } from '@/shared/ui'
import { matchName } from '../lib/matchName'
import { useProduct, useProducts } from '../queries'
import type { Product } from '../types'
import styles from './ProductPage.module.css'

const LOW_STOCK = 200

export function ProductPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { formatDate, formatMoney, formatNumber } = useFormatters()
  const { watched, scopeRole, focus } = useScope()
  const productQuery = useProduct(id)
  const catalog = useProducts()
  const medications = useMedications()
  const decks = useClmDecks()
  const sessions = useClmSessions()
  const orders = useOrders()
  const customers = useVisibleCustomers()
  const lang = i18n.resolvedLanguage

  if (productQuery.isLoading) {
    return <p className="text-body-secondary">{t('common.loading')}</p>
  }
  if (productQuery.error || !productQuery.data) {
    return (
      <div className={styles.page}>
        <Back />
        <div className="alert alert-danger mb-0" role="alert">
          {t('products.detail.missing')}
        </div>
      </div>
    )
  }

  const product = productQuery.data
  const form = t(`products.forms.${product.form}`, { defaultValue: product.form })
  const category = t(`products.categories.${product.category}`, { defaultValue: product.category })
  const stock = product.stock <= 0 ? 'out' : product.stock < LOW_STOCK ? 'low' : 'ok'
  const aids = (decks.data ?? []).filter((deck) => deck.productName === product.name)
  const aid = aids[0] ?? matchName(product.name, decks.data ?? [], (deck) => deck.productName)
  const aidList = aids.length ? aids : aid ? [aid] : []
  const liveAid = aidList.find((deck) => !isExpired(deck.approvedUntil))
  const briefing = matchName(product.name, medications.data ?? [], (item) => item.tradeName)
  const active = briefing?.substances.find((item) => item.role === 'active')
  const visibleSessions = (sessions.data ?? []).filter((session) =>
    nameVisible(session.repName, focus, scopeRole, watched),
  )
  const aidIds = new Set(aidList.map((deck) => deck.id))
  const calls = visibleSessions.filter((session) => aidIds.has(session.deckId))
  const said = aidList
    .flatMap((deck) => feedbackLines([deck], visibleSessions, deck.id, lang))
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
    .slice(0, 6)
  const names = new Map((customers.data ?? []).map((customer) => [customer.id, customer.name]))
  const ordered = (orders.data ?? [])
    .flatMap((order) =>
      order.items
        .filter((item) => item.productId === product.id && names.has(order.customerId))
        .map((item) => ({
          id: `${order.id}-${item.productId}`,
          customerName: names.get(order.customerId) ?? '',
          date: order.orderDate,
          quantity: item.quantity,
          status: order.status,
        })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
  const kept = ordered.filter((line) => line.status !== 'cancelled')
  const accounts = new Set(kept.map((line) => line.customerName)).size
  const units = kept.reduce((sum, line) => sum + line.quantity, 0)
  const related = (catalog.data ?? [])
    .filter((item) => item.category === product.category && item.id !== product.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6)
  const supply = briefing
    ? [
        briefing.availability.retail ? t('products.detail.pharmacy') : '',
        briefing.availability.hospital ? t('products.detail.hospital') : '',
        briefing.availability.eopyy ? t('products.detail.eopyy') : '',
        t(briefing.availability.prescription ? 'products.detail.rx' : 'products.detail.otc'),
      ].filter(Boolean)
    : []

  return (
    <section className={styles.page}>
      <Back />
      <div className={styles.top}>
        <div className={styles.identity}>
          <Pack product={product} image={liveAid?.image || aidList[0]?.image} />
          <div>
            <h1 className={styles.name}>{product.name}</h1>
            <p className={styles.meta}>
              {category}
              <span aria-hidden="true"> · </span>
              {t('products.detail.pack', { form, count: product.packSize })}
              <span aria-hidden="true"> · </span>
              {t('products.detail.sku', { sku: product.sku })}
            </p>
            <div className={styles.badges}>
              <StatusBadge tone={product.active ? 'success' : 'danger'}>
                {t(product.active ? 'products.status.active' : 'products.status.inactive')}
              </StatusBadge>
              <StatusBadge tone={product.prescriptionRequired ? 'warning' : 'neutral'}>
                {t(product.prescriptionRequired ? 'products.detail.rx' : 'products.detail.otc')}
              </StatusBadge>
              <StatusBadge tone={stock === 'out' ? 'danger' : stock === 'low' ? 'warning' : 'success'}>
                {t(`products.detail.stock${stock === 'out' ? 'Out' : stock === 'low' ? 'Low' : 'Ok'}`)}
              </StatusBadge>
            </div>
          </div>
        </div>
        {liveAid && (
          <Link to={`/clm/${liveAid.id}`} className="btn btn-primary">
            <i className="bi bi-easel me-2" aria-hidden="true" />
            {t('products.detail.openAid')}
          </Link>
        )}
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>{t('products.detail.price')}</dt>
          <dd>{formatMoney(product.price)}</dd>
        </div>
        <div>
          <dt>{t('products.detail.stock')}</dt>
          <dd className={stock === 'low' ? styles.low : stock === 'out' ? styles.out : undefined}>
            {formatNumber(product.stock)}
          </dd>
        </div>
        <div>
          <dt>{t('products.detail.accounts')}</dt>
          <dd>{orders.isLoading || customers.isLoading ? '—' : formatNumber(accounts)}</dd>
        </div>
        <div>
          <dt>{t('products.detail.calls')}</dt>
          <dd>{sessions.isLoading || decks.isLoading ? '—' : formatNumber(calls.length)}</dd>
        </div>
      </dl>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.panel} aria-labelledby="product-aid">
            <div className={styles.panelHead}>
              <h2 id="product-aid">{t('products.detail.aid')}</h2>
            </div>
            {decks.isLoading ? (
              <p className={styles.empty}>{t('common.loading')}</p>
            ) : aidList.length === 0 ? (
              <p className={styles.empty}>{t('products.detail.aidEmpty')}</p>
            ) : (
              <ul className={styles.aids}>
                {aidList.map((deck) => (
                  <li key={deck.id}>
                    <AidRow deck={deck} lang={lang} formatDate={formatDate} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="product-briefing">
            <div className={styles.panelHead}>
              <h2 id="product-briefing">{t('products.detail.briefing')}</h2>
              {briefing && (
                <Link to={`/medication/${briefing.id}`} className={styles.textLink}>
                  {t('products.detail.openBriefing')}
                </Link>
              )}
            </div>
            {medications.isLoading ? (
              <p className={styles.empty}>{t('common.loading')}</p>
            ) : !briefing ? (
              <p className={styles.empty}>{t('products.detail.briefingEmpty')}</p>
            ) : (
              <div className={styles.body}>
                <p className={styles.summary}>{medText(briefing.summary, lang)}</p>
                {active && (
                  <p className={styles.line}>
                    <span>{t('products.detail.substance')}</span>
                    {lang?.startsWith('el') ? active.nameEl : active.name} {active.amount}
                  </p>
                )}
                <p className={styles.line}>
                  <span>{t('products.detail.dose')}</span>
                  {medText(briefing.administration.posology, lang)}
                </p>
                {supply.length > 0 && (
                  <p className={styles.line}>
                    <span>{t('products.detail.supply')}</span>
                    {supply.join(' · ')}
                  </p>
                )}
                {briefing.precautions.contraindications[0] && (
                  <p className={styles.caution}>
                    <i className="bi bi-exclamation-circle" aria-hidden="true" />
                    <span>
                      <strong>{t('products.detail.caution')}. </strong>
                      {medText(briefing.precautions.contraindications[0], lang)}
                    </span>
                  </p>
                )}
                <p className={styles.note}>{t('products.detail.fieldAid')}</p>
              </div>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="product-said">
            <div className={styles.panelHead}>
              <h2 id="product-said">{t('products.detail.said')}</h2>
            </div>
            {sessions.isLoading || decks.isLoading ? (
              <p className={styles.empty}>{t('common.loading')}</p>
            ) : said.length === 0 ? (
              <p className={styles.empty}>{t('products.detail.saidEmpty')}</p>
            ) : (
              <ul className={styles.quotes}>
                {said.map((line) => (
                  <li key={line.id} className={styles.quote} data-reaction={line.reaction}>
                    <p className={styles.said}>{line.feedback}</p>
                    <p className={styles.who}>
                      {line.customerName}
                      <span aria-hidden="true"> · </span>
                      {line.reaction ? t(`clm.reaction.${line.reaction}`) : line.slideTitle}
                      <span aria-hidden="true"> · </span>
                      {formatDate(line.endedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="product-orders">
            <div className={styles.panelHead}>
              <h2 id="product-orders">{t('products.detail.orders')}</h2>
              {!orders.isLoading && kept.length > 0 && (
                <span className={styles.count}>{t('products.detail.units', { count: units })}</span>
              )}
            </div>
            {orders.isLoading || customers.isLoading ? (
              <p className={styles.empty}>{t('common.loading')}</p>
            ) : ordered.length === 0 ? (
              <p className={styles.empty}>{t('products.detail.ordersEmpty')}</p>
            ) : (
              <ul className={styles.rows}>
                {ordered.slice(0, 8).map((line) => (
                  <li key={line.id} className={styles.row}>
                    <span>
                      <span className={styles.rowName}>{line.customerName}</span>
                      <span className={styles.rowMeta}>
                        {formatDate(line.date)}
                        <span aria-hidden="true"> · </span>
                        {t('products.detail.units', { count: line.quantity })}
                      </span>
                    </span>
                    <OrderStatusBadge status={line.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="product-related">
            <div className={styles.panelHead}>
              <h2 id="product-related">{t('products.detail.related', { category })}</h2>
            </div>
            {catalog.isLoading ? (
              <p className={styles.empty}>{t('common.loading')}</p>
            ) : related.length === 0 ? (
              <p className={styles.empty}>{t('products.detail.relatedEmpty')}</p>
            ) : (
              <ul className={styles.rows}>
                {related.map((item) => (
                  <li key={item.id}>
                    <Link to={`/products/${item.id}`} className={styles.related}>
                      <span>
                        <span className={styles.rowName}>{item.name}</span>
                        <span className={styles.rowMeta}>
                          {t('products.detail.pack', {
                            form: t(`products.forms.${item.form}`, { defaultValue: item.form }),
                            count: item.packSize,
                          })}
                        </span>
                      </span>
                      <i className="bi bi-chevron-right" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

function Pack({ product, image }: { product: Product; image?: string }) {
  if (image) {
    return <img className={styles.pack} src={image} alt="" />
  }
  return (
    <span className={styles.mark} aria-hidden="true">
      <i className={`bi ${product.form === 'Inhaler' ? 'bi-wind' : product.form === 'Gel' || product.form === 'Syrup' ? 'bi-droplet' : 'bi-capsule'}`} />
    </span>
  )
}

function AidRow({
  deck,
  lang,
  formatDate,
}: {
  deck: ClmDeck
  lang: string | undefined
  formatDate: (iso: string) => string
}) {
  const { t } = useTranslation()
  const ended = isExpired(deck.approvedUntil)
  const soon = isExpiring(deck.approvedUntil, EXPIRING_WITHIN_DAYS)
  const cue = localized(deck.slides[0]?.note, lang)

  return (
    <article className={styles.aid}>
      {deck.image ? <img src={deck.image} alt="" /> : <span className={styles.aidMark} aria-hidden="true"><i className="bi bi-easel" /></span>}
      <div>
        <h3>{localized(deck.title, lang)}</h3>
        <p>
          {t(`clm.audience.${deck.audience}`)}
          <span aria-hidden="true"> · </span>
          {t('products.detail.version', { version: deck.version })}
          <span aria-hidden="true"> · </span>
          {t('products.detail.validUntil', { date: formatDate(`${deck.approvedUntil}T12:00:00`) })}
        </p>
        {ended && <p className={styles.ended}>{t('products.detail.expired')}</p>}
        {!ended && soon && (
          <p className={styles.soon}>{t('products.detail.expiring', { count: daysUntil(deck.approvedUntil) })}</p>
        )}
        {cue && <p className={styles.cue}>{cue}</p>}
      </div>
      {ended ? (
        <span className={styles.closed}>{t('products.detail.expiredShort')}</span>
      ) : (
        <Link to={`/clm/${deck.id}`} className={styles.present}>
          {t('products.detail.openAid')}
        </Link>
      )}
    </article>
  )
}

function Back() {
  const { t } = useTranslation()
  return (
    <Link to="/products" className={styles.back}>
      <i className="bi bi-arrow-left" aria-hidden="true" />
      {t('products.detail.back')}
    </Link>
  )
}
