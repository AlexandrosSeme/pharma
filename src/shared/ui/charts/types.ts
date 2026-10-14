export type ChartSeries = {
  label: string
  data: number[]
  /** One color for the whole series, or one per data point. Defaults to the theme's chart palette. */
  color?: string | string[]
}
