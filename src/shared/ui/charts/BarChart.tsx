import type { ChartData, ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import './setup'
import { baseOptions, categoryAxis, useChartTheme, valueAxis } from './chartTheme'
import type { ChartSeries } from './types'

type BarChartProps = {
  labels: string[]
  series: ChartSeries[]
  horizontal?: boolean
  stacked?: boolean
  formatValue?: (value: number) => string
  ariaLabel: string
}

export function BarChart({
  labels,
  series,
  horizontal = false,
  stacked = false,
  formatValue = String,
  ariaLabel,
}: BarChartProps) {
  const theme = useChartTheme()

  const data: ChartData<'bar'> = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.color ?? theme.series[i % theme.series.length],
      borderRadius: 3,
      maxBarThickness: horizontal ? 16 : 28,
      categoryPercentage: 0.7,
      barPercentage: 0.9,
    })),
  }

  const base = baseOptions(theme, series.length > 1)
  const value = valueAxis(theme, formatValue, stacked)
  const category = categoryAxis(theme, stacked)

  const options: ChartOptions<'bar'> = {
    ...base,
    indexAxis: horizontal ? 'y' : 'x',
    scales: horizontal ? { x: value, y: category } : { x: category, y: value },
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const v = horizontal ? ctx.parsed.x : ctx.parsed.y
            return ` ${ctx.dataset.label}: ${formatValue(v ?? 0)}`
          },
        },
      },
    },
  }

  return <Bar data={data} options={options} role="img" aria-label={ariaLabel} />
}
