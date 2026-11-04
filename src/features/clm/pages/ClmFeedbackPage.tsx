import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { DataTable, KpiCard, KpiGrid, PageHeader, Select, StatusBadge, type Column } from '@/shared/ui'
import { BarChart, ChartCard, DoughnutChart, useChartTheme } from '@/shared/ui/charts'
import { feedbackLines, productFeedback, reactionTotals, type FeedbackLine, type ProductFeedback } from '../lib/feedback'
import { useClmDecks, useClmSessions } from '../queries'
import { slideReactions, type SlideReaction } from '../types'

const reactionTone: Record<SlideReaction, 'accent' | 'info' | 'warning' | 'neutral'> = {
  interested: 'accent',
  question: 'info',
  concern: 'warning',
  neutral: 'neutral',
}

export function ClmFeedbackPage() {
  const { t, i18n } = useTranslation()
  const { formatDateTime, formatNumber, formatPercent } = useFormatters()
  const theme = useChartTheme()
  const decks = useClmDecks()
  const sessions = useClmSessions()
  const [deckId, setDeckId] = useState('')
  const lang = i18n.resolvedLanguage

  const loading = decks.isLoading || sessions.isLoading
  const error = decks.error ?? sessions.error
  const deckList = decks.data ?? []
  const sessionList = sessions.data ?? []

  const products = useMemo(() => productFeedback(deckList, sessionList, deckId), [deckList, sessionList, deckId])
  const lines = useMemo(
    () => feedbackLines(deckList, sessionList, deckId, lang),
    [deckList, sessionList, deckId, lang],
  )
  const totals = reactionTotals(products)
  const calls = products.reduce((sum, row) => sum + row.calls, 0)
  const shown = products.reduce((sum, row) => sum + row.shown, 0)
  const possible = products.reduce((sum, row) => sum + row.possible, 0)
  const concerns = products.reduce((sum, row) => sum + row.reactions.concern, 0)

  const reactionLabels = slideReactions.map((reaction) => t(`clm.reaction.${reaction}`))
  const reactionColors = [theme.tones.accent, theme.tones.info, theme.tones.warning, theme.tones.neutral]

  const productColumns: Column<ProductFeedback>[] = [
    { key: 'product', header: t('clm.feedback.product'), mobile: 'title', render: (row) => row.productName },
    { key: 'calls', header: t('clm.feedback.calls'), align: 'right', render: (row) => formatNumber(row.calls) },
    {
      key: 'reach',
      header: t('clm.feedback.reach'),
      align: 'right',
      render: (row) => formatPercent(row.possible ? row.shown / row.possible : 0),
    },
    ...slideReactions.map(
      (reaction): Column<ProductFeedback> => ({
        key: reaction,
        header: t(`clm.reaction.${reaction}`),
        align: 'right',
        tableClassName: reaction === 'neutral' ? 'd-none d-xl-table-cell' : undefined,
        mobile: reaction === 'neutral' ? 'hidden' : undefined,
        render: (row) => formatNumber(row.reactions[reaction]),
      }),
    ),
    {
      key: 'follow',
      header: t('clm.feedback.followUps'),
      align: 'right',
      render: (row) => formatNumber(row.followUps),
    },
  ]

  const lineColumns: Column<FeedbackLine>[] = [
    { key: 'when', header: t('clm.feedback.when'), render: (row) => formatDateTime(row.endedAt) },
    { key: 'product', header: t('clm.feedback.product'), mobile: 'title', render: (row) => row.productName },
    { key: 'customer', header: t('clm.feedback.customer'), render: (row) => row.customerName },
    {
      key: 'rep',
      header: t('clm.rep'),
      tableClassName: 'd-none d-xl-table-cell',
      mobile: 'hidden',
      render: (row) => row.repName,
    },
    { key: 'slide', header: t('clm.feedback.slide'), render: (row) => row.slideTitle },
    {
      key: 'reaction',
      header: t('clm.reaction.label'),
      render: (row) =>
        row.reaction ? (
          <StatusBadge tone={reactionTone[row.reaction]}>{t(`clm.reaction.${row.reaction}`)}</StatusBadge>
        ) : (
          '—'
        ),
    },
    { key: 'said', header: t('clm.review.said'), render: (row) => row.feedback },
  ]

  return (
    <section>
      <PageHeader
        title={t('clm.feedback.title')}
        subtitle={t('clm.feedback.subtitle')}
        actions={
          <>
            <Select
              aria-label={t('clm.feedback.product')}
              value={deckId}
              onChange={setDeckId}
              options={[
                { value: '', label: t('clm.feedback.allProducts') },
                ...deckList.map((deck) => ({ value: deck.id, label: deck.productName })),
              ]}
            />
            <Link to="/clm" className="btn btn-outline-secondary btn-sm">
              {t('clm.back')}
            </Link>
          </>
        }
      />

      <KpiGrid columns={4}>
        <KpiCard icon="bi-chat-left-text" label={t('clm.feedback.lines')} value={loading ? '…' : formatNumber(lines.length)} />
        <KpiCard icon="bi-easel2" label={t('clm.feedback.calls')} value={loading ? '…' : formatNumber(calls)} />
        <KpiCard
          icon="bi-pie-chart"
          label={t('clm.feedback.reach')}
          value={loading ? '…' : formatPercent(possible ? shown / possible : 0)}
        />
        <KpiCard
          icon="bi-exclamation-circle"
          label={t('clm.feedback.concerns')}
          value={loading ? '…' : formatNumber(concerns)}
        />
      </KpiGrid>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-4">
          <ChartCard
            title={t('clm.feedback.charts.reactions')}
            subtitle={t('clm.feedback.charts.reactionsHint')}
            size="lg"
            isLoading={loading}
            error={error}
            isEmpty={!totals.some((value) => value > 0)}
          >
            <DoughnutChart
              ariaLabel={t('clm.feedback.charts.reactions')}
              labels={reactionLabels}
              data={totals}
              colors={reactionColors}
              formatValue={formatNumber}
            />
          </ChartCard>
        </div>
        <div className="col-12 col-xl-8">
          <ChartCard
            title={t('clm.feedback.charts.byProduct')}
            subtitle={t('clm.feedback.charts.byProductHint')}
            size="lg"
            isLoading={loading}
            error={error}
            isEmpty={products.every((row) => row.calls === 0)}
          >
            <BarChart
              horizontal
              stacked
              ariaLabel={t('clm.feedback.charts.byProduct')}
              labels={products.map((row) => row.productName)}
              series={slideReactions.map((reaction, index) => ({
                label: t(`clm.reaction.${reaction}`),
                data: products.map((row) => row.reactions[reaction]),
                color: reactionColors[index],
              }))}
              formatValue={formatNumber}
            />
          </ChartCard>
        </div>
      </div>

      <h2 className="h6 mb-3">{t('clm.feedback.byProduct')}</h2>
      <DataTable columns={productColumns} rows={loading ? undefined : products} isLoading={loading} error={error} cardsBelow="lg" />

      <h2 className="h6 mt-4 mb-3">{t('clm.feedback.saidTable')}</h2>
      <DataTable columns={lineColumns} rows={loading ? undefined : lines} isLoading={loading} error={error} cardsBelow="xl" />
    </section>
  )
}
