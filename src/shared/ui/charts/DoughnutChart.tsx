import type { ChartData, ChartOptions } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useFormatters } from '@/shared/hooks/useFormatters'
import './setup'
import { baseOptions, useChartTheme } from './chartTheme'

type DoughnutChartProps = {
  labels: string[]
  data: number[]
  colors?: string[]
  formatValue?: (value: number) => string
  ariaLabel: string
}

export function DoughnutChart({ labels, data, colors, formatValue = String, ariaLabel }: DoughnutChartProps) {
  const theme = useChartTheme()
  const { formatPercent } = useFormatters()
  const total = data.reduce((sum, v) => sum + v, 0)

  const chartData: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors ?? theme.series,
        borderColor: theme.surface,
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }

  const base = baseOptions(theme, true)

  const options: ChartOptions<'doughnut'> = {
    ...base,
    cutout: '68%',
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const share = total ? ctx.parsed / total : 0
            return ` ${ctx.label}: ${formatValue(ctx.parsed)} (${formatPercent(share)})`
          },
        },
      },
    },
  }

  return <Doughnut data={chartData} options={options} role="img" aria-label={ariaLabel} />
}
