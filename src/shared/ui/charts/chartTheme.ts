import { useColorScheme, type ColorScheme } from '@/shared/hooks/useColorScheme'
import type { BadgeTone } from '../tones'

const toneVars: Record<BadgeTone, string> = {
  neutral: '--bs-secondary-color',
  accent: '--bs-primary',
  success: '--bs-success',
  info: '--bs-info',
  warning: '--bs-warning',
  danger: '--bs-danger',
}

export type ChartTheme = {
  scheme: ColorScheme
  series: string[]
  tones: Record<BadgeTone, string>
  text: string
  grid: string
  surface: string
  tooltipBg: string
  tooltipText: string
  font: { family: string; size: number }
}

function readTheme(scheme: ColorScheme): ChartTheme {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()

  return {
    scheme,
    series: [1, 2, 3, 4, 5, 6].map((i) => v(`--app-chart-${i}`)),
    tones: Object.fromEntries(
      Object.entries(toneVars).map(([tone, name]) => [tone, v(name)]),
    ) as Record<BadgeTone, string>,
    text: v('--bs-secondary-color'),
    grid: v('--bs-border-color'),
    surface: v('--bs-body-bg'),
    tooltipBg: v('--app-nav-bg'),
    tooltipText: v('--app-on-brand'),
    font: { family: v('--bs-body-font-family'), size: 12 },
  }
}

export function useChartTheme() {
  const scheme = useColorScheme()
  return readTheme(scheme)
}

export function withAlpha(hex: string, alpha: number) {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function baseOptions(theme: ChartTheme, showLegend: boolean) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          color: theme.text,
          font: theme.font,
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleColor: theme.tooltipText,
        bodyColor: theme.tooltipText,
        titleFont: { ...theme.font, weight: 600 },
        bodyFont: theme.font,
        padding: 10,
        cornerRadius: 4,
        boxPadding: 4,
      },
    },
  }
}

export function valueAxis(theme: ChartTheme, format: (value: number) => string, stacked = false) {
  return {
    stacked,
    beginAtZero: true,
    border: { display: false },
    grid: { color: theme.grid },
    ticks: {
      color: theme.text,
      font: theme.font,
      maxTicksLimit: 6,
      callback: (value: string | number) => format(Number(value)),
    },
  }
}

export function categoryAxis(theme: ChartTheme, stacked = false) {
  return {
    stacked,
    border: { display: false },
    grid: { display: false },
    ticks: { color: theme.text, font: theme.font, maxRotation: 0, autoSkip: true },
  }
}
