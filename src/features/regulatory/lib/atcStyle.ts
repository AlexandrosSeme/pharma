const tones: Record<string, string> = {
  A: 'var(--app-chart-4)',
  B: 'var(--bs-danger)',
  C: 'var(--bs-primary)',
  H: 'var(--bs-info)',
  J: 'var(--app-chart-3)',
  M: 'var(--bs-warning)',
  N: 'var(--bs-info)',
  R: 'var(--app-chart-2)',
}

export function atcTone(code: string) {
  return tones[code.charAt(0)] ?? 'var(--bs-secondary-color)'
}
