import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './setup'
import { baseOptions, categoryAxis, useChartTheme, valueAxis, withAlpha } from './chartTheme'
import type { ChartSeries } from './types'

type LineChartProps = {
  labels: string[]
  series: ChartSeries[]
  formatValue?: (value: number) => string
  ariaLabel: string
}

export function LineChart({ labels, series, formatValue = String, ariaLabel }: LineChartProps) {
  const theme = useChartTheme()
  const single = series.length === 1

  const data: ChartData<'line'> = {
    labels,
    datasets: series.map((s, i) => {
      const color = typeof s.color === 'string' ? s.color : theme.series[i % theme.series.length]
      return {
        label: s.label,
        data: s.data,
        borderColor: color,
        backgroundColor: single ? withAlpha(color, 0.08) : color,
        fill: single,
        cubicInterpolationMode: 'monotone',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: theme.surface,
        pointBorderColor: color,
        pointBorderWidth: 2,
      }
    }),
  }

  const base = baseOptions(theme, !single)

  const options: ChartOptions<'line'> = {
    ...base,
    interaction: { mode: 'index', intersect: false },
    scales: { x: categoryAxis(theme), y: valueAxis(theme, formatValue) },
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatValue(ctx.parsed.y ?? 0)}`,
        },
      },
    },
  }

  return <Line data={data} options={options} role="img" aria-label={ariaLabel} />
}
