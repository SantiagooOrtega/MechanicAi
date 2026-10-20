import { useEffect, useRef, useState } from 'react'
import { drawExplodedCar } from './car-exploded'

/**
 * Carro que se desarma y se vuelve a armar en bucle, sin scroll.
 * Reproduce una secuencia de fotogramas en un canvas; si no cargan, dibuja el carro de respaldo.
 */

export type CarLoopFrames = { count: number; url: (index: number) => string }

// Ciclo: pausa armado, desarma, pausa desarmado, arma
const HOLD_ASSEMBLED = 1.6
const DISASSEMBLE = 3.4
const HOLD_EXPLODED = 1.1
const REASSEMBLE = 3.4
const CYCLE = HOLD_ASSEMBLED + DISASSEMBLE + HOLD_EXPLODED + REASSEMBLE

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Progreso 0..1 de la animación (0 = armado, 0.5 = desarmado del todo) según el segundo del ciclo */
function cycleProgress(sec: number) {
  let s = sec % CYCLE
  if (s < HOLD_ASSEMBLED) return 0
  s -= HOLD_ASSEMBLED
  if (s < DISASSEMBLE) return 0.5 * ease(s / DISASSEMBLE)
  s -= DISASSEMBLE
  if (s < HOLD_EXPLODED) return 0.5
  s -= HOLD_EXPLODED
  return 0.5 + 0.5 * ease(s / REASSEMBLE)
}

export function CarLoop({ frames, paused = false }: { frames: CarLoopFrames; paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [ok, setOk] = useState(true)
  const [aspect, setAspect] = useState(16 / 9)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  // Carga progresiva: los primeros ya, el resto por lotes
  useEffect(() => {
    let cancelled = false
    let errored = 0
    const { count, url } = frames
    const images: HTMLImageElement[] = new Array(count)
    imagesRef.current = images
    const loadOne = (i: number) => {
      const img = new window.Image()
      img.decoding = 'async'
      img.onerror = () => { errored++; if (!cancelled && errored >= 5) setOk(false) }
      if (i === 0) {
        img.onload = () => {
          if (cancelled || !img.naturalWidth) return
          const canvas = canvasRef.current
          if (canvas) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight }
          setAspect(img.naturalWidth / img.naturalHeight)
        }
      }
      img.src = url(i)
      images[i] = img
    }
    const INITIAL = Math.min(24, count)
    for (let i = 0; i < INITIAL; i++) loadOne(i)
    let cursor = INITIAL
    let timer: ReturnType<typeof setTimeout> | null = null
    const next = () => {
      if (cancelled) return
      const end = Math.min(count, cursor + 24)
      for (let i = cursor; i < end; i++) loadOne(i)
      cursor = end
      if (cursor < count) timer = setTimeout(next, 60)
    }
    timer = setTimeout(next, 150)
    const fallback = window.setTimeout(() => {
      if (!cancelled && !images[0]?.complete) setOk(false)
    }, 6000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      window.clearTimeout(fallback)
    }
  }, [frames])

  // Reproducción
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { count } = frames
    const loaded = (i: number) => {
      const img = imagesRef.current[i]
      return !!img && img.complete && img.naturalWidth > 0
    }
    if (!ok) {
      canvas.width = 1600
      canvas.height = Math.round(1600 / aspect)
    }
    let raf = 0
    let last = -1
    let origin = performance.now()
    const paint = (progress: number) => {
      if (!ok) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawExplodedCar(ctx, progress, canvas.width, canvas.height)
        return
      }
      const want = Math.min(count - 1, Math.round(progress * (count - 1)))
      let idx = -1
      if (loaded(want)) idx = want
      else for (let d = 1; d < count; d++) {
        if (want - d >= 0 && loaded(want - d)) { idx = want - d; break }
        if (want + d < count && loaded(want + d)) { idx = want + d; break }
      }
      if (idx === -1 || idx === last) return
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(imagesRef.current[idx], 0, 0, canvas.width, canvas.height)
      last = idx
    }
    if (reduced || paused) {
      // sin movimiento: se queda el carro armado
      const poll = window.setInterval(() => paint(0), 250)
      paint(0)
      return () => window.clearInterval(poll)
    }
    const tick = (now: number) => {
      paint(cycleProgress((now - origin) / 1000))
      raf = requestAnimationFrame(tick)
    }
    origin = performance.now()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frames, ok, aspect, reduced, paused])

  return <canvas ref={canvasRef} aria-hidden className="car-loop" style={{ aspectRatio: String(aspect), ['--ar' as string]: aspect }} />
}
