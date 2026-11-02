import { useEffect, useEffectEvent, type RefObject } from 'react'

const WHEEL_STEP = 40
const PINCH_STEP = 1.2

type Direction = 1 | -1

/**
 * Ctrl/⌘ + wheel (also what a trackpad pinch sends) and two-finger pinch on touch screens.
 * The element needs `touch-action: pan-x pan-y` so the browser doesn't zoom the whole page instead.
 */
export function usePinchZoom(ref: RefObject<HTMLElement | null>, enabled: boolean, onZoom: (direction: Direction) => void) {
  const zoom = useEffectEvent(onZoom)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let wheel = 0
    let baseDistance = 0
    const distance = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      wheel += e.deltaY
      if (Math.abs(wheel) >= WHEEL_STEP) {
        zoom(wheel < 0 ? 1 : -1)
        wheel = 0
      }
    }
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) baseDistance = distance(e.touches)
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !baseDistance) return
      e.preventDefault()
      const ratio = distance(e.touches) / baseDistance
      if (ratio > PINCH_STEP || ratio < 1 / PINCH_STEP) {
        zoom(ratio > 1 ? 1 : -1)
        baseDistance = distance(e.touches)
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) baseDistance = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [ref, enabled])
}
