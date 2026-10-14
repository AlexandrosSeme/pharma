import type { LogoOnDark, LogoShape } from '@/shared/ui'

export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'
export const LOGO_MAX_BYTES = 1024 * 1024

/** Every logo is cropped to its content and stored at this height, so all logos render the same size. */
const OUTPUT_HEIGHT = 160
const OUTPUT_MAX_WIDTH = 800
const WORK_SIZE = 768
const ALPHA_THRESHOLD = 16
const BACKGROUND_THRESHOLD = 40
/** Logos at least this many times wider than tall are wordmarks; anything narrower is an emblem. */
const WIDE_RATIO = 2
/** Below this contrast against the dark bars, a pixel counts as hard to see. */
const MIN_PIXEL_CONTRAST = 2
/** If more than this share of the logo is hard to see, it needs a different treatment. */
const MAX_LOW_CONTRAST_SHARE = 0.25
/** Average saturation above this means the logo has real colors (white silhouette would ruin it). */
const COLORFUL_SATURATION = 0.2
const FALLBACK_NAV_BG = '#4c4c4c'
const WHITE_LUMINANCE = 1

export type ProcessedLogo = {
  dataUrl: string
  shape: LogoShape
  /** Recommended treatment on the dark sidebar and top bar, based on the logo's colors. */
  onDark: LogoOnDark
  /** True when the logo is too light for white backgrounds (e.g. a white logo). */
  needsDarkTileOnLight: boolean
}

export class LogoFileError extends Error {
  readonly reason: 'type' | 'size' | 'read'

  constructor(reason: 'type' | 'size' | 'read') {
    super(`Invalid logo file: ${reason}`)
    this.reason = reason
  }
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new LogoFileError('read'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new LogoFileError('read'))
    img.src = src
  })
}

const channel = (c: number) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = (r: number, g: number, b: number) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/** Luminance of the dark navigation background, read from the theme so it follows --app-nav-bg. */
function navLuminance() {
  const probe = document.createElement('div')
  probe.dataset.bsTheme = 'dark'
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue('--app-nav-bg').trim() || FALLBACK_NAV_BG
  probe.remove()
  const hex = value.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const n = Number.parseInt(full, 16)
  return Number.isNaN(n) ? luminance(76, 76, 76) : luminance((n >> 16) & 255, (n >> 8) & 255, n & 255)
}

/**
 * Finds the logo's content box (ignoring transparent or solid-color margins taken from the
 * top-left pixel) and measures how it would look on the dark bars.
 */
function analyse({ data, width, height }: ImageData, navLum: number) {
  const [bgR, bgG, bgB, bgA] = data
  let top = height
  let left = width
  let right = -1
  let bottom = -1
  let count = 0
  let lowContrast = 0
  let lowContrastOnWhite = 0
  let saturation = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < ALPHA_THRESHOLD) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const isBackground =
        bgA >= ALPHA_THRESHOLD &&
        Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < BACKGROUND_THRESHOLD
      if (isBackground) continue

      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
      count++
      const lum = luminance(r, g, b)
      if (contrast(lum, navLum) < MIN_PIXEL_CONTRAST) lowContrast++
      if (contrast(lum, WHITE_LUMINANCE) < MIN_PIXEL_CONTRAST) lowContrastOnWhite++
      const max = Math.max(r, g, b)
      saturation += max ? (max - Math.min(r, g, b)) / max : 0
    }
  }

  if (!count) return null
  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
    hasOpaqueBackground: bgA >= ALPHA_THRESHOLD,
    lowContrastShare: lowContrast / count,
    lowContrastOnWhiteShare: lowContrastOnWhite / count,
    colorful: saturation / count > COLORFUL_SATURATION,
  }
}

function recommendOnDark(box: NonNullable<ReturnType<typeof analyse>>): LogoOnDark {
  // A logo with its own solid background (e.g. a JPG on white) already looks like a tile.
  if (box.hasOpaqueBackground) return 'frame'
  if (box.lowContrastShare <= MAX_LOW_CONTRAST_SHARE) return 'original'
  return box.colorful ? 'frame' : 'white'
}

/** Crops empty margins, scales to a fixed height, and detects the logo's shape and best dark treatment. */
export async function normalizeLogo(src: string): Promise<ProcessedLogo> {
  const img = await loadImage(src)
  const { naturalWidth: w, naturalHeight: h } = img
  const fallback: ProcessedLogo = {
    dataUrl: src,
    shape: w && h && w / h >= WIDE_RATIO ? 'wide' : 'emblem',
    onDark: 'frame',
    needsDarkTileOnLight: false,
  }
  if (!w || !h) return fallback

  const scale = WORK_SIZE / Math.max(w, h)
  const work = document.createElement('canvas')
  work.width = Math.max(1, Math.round(w * scale))
  work.height = Math.max(1, Math.round(h * scale))
  const workCtx = work.getContext('2d', { willReadFrequently: true })
  if (!workCtx) return fallback
  workCtx.drawImage(img, 0, 0, work.width, work.height)

  let box: ReturnType<typeof analyse>
  try {
    box = analyse(workCtx.getImageData(0, 0, work.width, work.height), navLuminance())
  } catch {
    return fallback
  }
  if (!box) return fallback

  const outScale = Math.min(OUTPUT_HEIGHT / box.height, OUTPUT_MAX_WIDTH / box.width)
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(box.width * outScale))
  out.height = Math.max(1, Math.round(box.height * outScale))
  const outCtx = out.getContext('2d')
  if (!outCtx) return fallback
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(work, box.left, box.top, box.width, box.height, 0, 0, out.width, out.height)

  return {
    dataUrl: out.toDataURL('image/png'),
    shape: box.width / box.height >= WIDE_RATIO ? 'wide' : 'emblem',
    onDark: recommendOnDark(box),
    needsDarkTileOnLight: !box.hasOpaqueBackground && box.lowContrastOnWhiteShare > MAX_LOW_CONTRAST_SHARE,
  }
}

/** Validates an uploaded logo file and normalizes it. */
export async function readLogoFile(file: File): Promise<ProcessedLogo> {
  if (!LOGO_ACCEPT.split(',').includes(file.type)) throw new LogoFileError('type')
  if (file.size > LOGO_MAX_BYTES) throw new LogoFileError('size')
  return normalizeLogo(await readAsDataUrl(file))
}
