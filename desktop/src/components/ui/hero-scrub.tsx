import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Hero con scroll: la tarjeta crece hasta llenar la pantalla, los títulos se separan
 * y una animación (`draw`) avanza con el scroll. Basado en HeroScrub de 21st.dev,
 * pero en lugar de una secuencia de fotogramas recibe una función que dibuja en canvas.
 */

const PIN_VH_MULTIPLE = 3.2
const IMMERSE_OVERFILL = 1.04
const ENTRY_DELAY = 0.2
const START_SCALE_DESKTOP = 0.6
const START_SCALE_MOBILE = 0.82
const RENDER_SCALE = 1.7 // el canvas se dibuja más grande porque la tarjeta se amplía al hacer scroll

export type HeroFrames = { count: number; url: (index: number) => string }

export type HeroScrubProps = {
  titleTop: ReactNode
  titleBottom: ReactNode
  /** Secuencia de imágenes que avanza con el scroll. Si no carga, se usa `draw` */
  frames?: HeroFrames
  /** Animación dibujada en canvas; t va de 0 a 1 según el progreso del scroll */
  draw: (ctx: CanvasRenderingContext2D, t: number, width: number, height: number) => void
  /** Contenedor con scroll (por defecto, la ventana) */
  scroller?: HTMLElement | null
  aspect?: number
  scrollHint?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return reduced
}

export function HeroScrub({ titleTop, titleBottom, frames, draw, scroller, aspect: aspectProp = 16 / 9, scrollHint }: HeroScrubProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLHeadingElement>(null)
  const bottomRef = useRef<HTMLHeadingElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const reduced = usePrefersReducedMotion()
  const imagesRef = useRef<HTMLImageElement[]>([])
  const lastDrawnRef = useRef(-1)
  const [frameAspect, setFrameAspect] = useState<number | null>(null)
  const [framesOk, setFramesOk] = useState(Boolean(frames))
  const useFrames = Boolean(frames) && framesOk
  const aspect = useFrames && frameAspect ? frameAspect : aspectProp

  // Carga progresiva de los fotogramas: los primeros ya, el resto por lotes
  const frameCount = frames?.count ?? 0
  const frameUrl = frames?.url
  useEffect(() => {
    if (!frameUrl || !frameCount || reduced) return
    let cancelled = false
    let errored = 0
    const images: HTMLImageElement[] = new Array(frameCount)
    imagesRef.current = images
    lastDrawnRef.current = -1

    const loadOne = (i: number) => {
      const img = new window.Image()
      img.decoding = 'async'
      img.onerror = () => { errored++; if (!cancelled && errored >= 5) setFramesOk(false) }
      if (i === 0) {
        img.onload = () => {
          if (cancelled || !img.naturalWidth) return
          const canvas = canvasRef.current
          if (canvas) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight }
          setFrameAspect(img.naturalWidth / img.naturalHeight)
        }
      }
      img.src = frameUrl(i)
      images[i] = img
    }

    const INITIAL = Math.min(20, frameCount)
    for (let i = 0; i < INITIAL; i++) loadOne(i)
    let cursor = INITIAL
    let timer: ReturnType<typeof setTimeout> | null = null
    const loadNext = () => {
      if (cancelled) return
      const end = Math.min(frameCount, cursor + 20)
      for (let i = cursor; i < end; i++) loadOne(i)
      cursor = end
      if (cursor < frameCount) timer = setTimeout(loadNext, 80)
    }
    timer = setTimeout(loadNext, 200)
    // sin red o sin primer fotograma a tiempo: se usa el carro dibujado
    const fallback = window.setTimeout(() => {
      if (!cancelled && !images[0]?.complete) setFramesOk(false)
    }, 6000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      window.clearTimeout(fallback)
    }
  }, [frameUrl, frameCount, reduced])

  // Tamaño real del canvas y dibujo (también cuando cambia `draw`)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const loaded = (i: number) => {
      const img = imagesRef.current[i]
      return !!img && img.complete && img.naturalWidth > 0
    }
    const paint = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      if (useFrames) {
        // fotograma más cercano que ya esté cargado
        const want = Math.min(frameCount - 1, Math.floor(progressRef.current * frameCount))
        let idx = -1
        if (loaded(want)) idx = want
        else for (let d = 1; d < frameCount; d++) {
          if (want - d >= 0 && loaded(want - d)) { idx = want - d; break }
          if (want + d < frameCount && loaded(want + d)) { idx = want + d; break }
        }
        if (idx === -1 || idx === lastDrawnRef.current) return
        ctx.drawImage(imagesRef.current[idx], 0, 0, canvas.width, canvas.height)
        lastDrawnRef.current = idx
        return
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawRef.current(ctx, progressRef.current, canvas.width, canvas.height)
    }
    const resize = () => {
      if (!useFrames) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.min(Math.round(canvas.clientWidth * dpr * RENDER_SCALE), 2800)
        if (w > 0 && canvas.width !== w) {
          canvas.width = w
          canvas.height = Math.round(w / aspect)
        }
      }
      lastDrawnRef.current = -1
      paint()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    // los fotogramas van llegando: repintar hasta que haya uno
    const poll = useFrames ? window.setInterval(paint, 250) : 0
    ;(canvas as HTMLCanvasElement & { __paint?: () => void }).__paint = paint
    return () => { ro.disconnect(); if (poll) window.clearInterval(poll) }
  }, [aspect, draw, useFrames, frameCount])

  // Entrada
  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: ENTRY_DELAY })
      tl.from(bgRef.current, { opacity: 0, duration: 1.4, ease: 'power2.out' })
      tl.from(cardRef.current, { opacity: 0, duration: 1.1, ease: 'power3.out' }, 0.35)
      tl.from(topRef.current, { opacity: 0, y: 30, duration: 1, ease: 'expo.out' }, 0.5)
      tl.from(bottomRef.current, { opacity: 0, y: -30, duration: 1, ease: 'expo.out' }, 0.62)
      tl.from(hintRef.current, { opacity: 0, duration: 0.8 }, 1.2)
    }, sectionRef)
    return () => ctx.revert()
  }, [reduced])

  // Coreografía con scroll
  useEffect(() => {
    if (reduced) return
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const startScale = () => (window.innerWidth < 768 ? START_SCALE_MOBILE : START_SCALE_DESKTOP)
      const immerseScale = () => {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const baseW = Math.min(vw * 0.96, vh * 0.56 * aspect)
        const baseH = Math.min(vh * 0.56, (vw * 0.96) / aspect)
        if (baseW <= 0 || baseH <= 0) return 1.5
        return Math.max(vw / baseW, vh / baseH) * IMMERSE_OVERFILL
      }

      gsap.set(cardRef.current, { scale: startScale(), transformOrigin: '50% 50%' })

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scroller: scroller ?? window,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressRef.current = gsap.utils.clamp(0, 1, (self.progress - 0.15) / 0.63)
            ;(canvasRef.current as (HTMLCanvasElement & { __paint?: () => void }) | null)?.__paint?.()
          },
        },
      })

      const spread = () => (window.innerWidth < 768 ? '70vw' : '60vw')
      master.to(cardRef.current, { scale: 1, ease: 'power2.out', duration: 0.15 }, 0)
      master.to(topRef.current, { x: () => `-${spread()}`, letterSpacing: '0.02em', ease: 'power2.inOut', duration: 0.15 }, 0)
      master.to(bottomRef.current, { x: () => spread(), letterSpacing: '0.02em', ease: 'power2.inOut', duration: 0.15 }, 0)
      master.to(hintRef.current, { opacity: 0, duration: 0.05 }, 0)

      master.to(cardRef.current, { scale: immerseScale(), ease: 'power2.in', duration: 0.63 }, 0.15)
      master.to(topRef.current, { opacity: 0, ease: 'power1.in', duration: 0.22 }, 0.15)
      master.to(bottomRef.current, { opacity: 0, ease: 'power1.in', duration: 0.22 }, 0.15)

      master.to(cardRef.current, { scale: startScale(), ease: 'power3.inOut', duration: 0.22 }, 0.78)
      master.to(topRef.current, { x: 0, opacity: 1, letterSpacing: '-0.04em', ease: 'power2.inOut', duration: 0.22 }, 0.78)
      master.to(bottomRef.current, { x: 0, opacity: 1, letterSpacing: '-0.04em', ease: 'power2.inOut', duration: 0.22 }, 0.78)

      ScrollTrigger.refresh()
    }, sectionRef)

    return () => ctx.revert()
  }, [reduced, aspect, scroller])

  return (
    <section ref={sectionRef} className="hs" data-reduced={reduced} style={{ height: `${(PIN_VH_MULTIPLE + 1) * 100}vh` }}
      aria-label="Mechanic IA">
      <div className="hs-sticky">
        <div ref={bgRef} aria-hidden className="hs-bg" />
        <div className="hs-titles">
          <h2 ref={topRef} aria-hidden className="hs-title">{titleTop}</h2>
          <div ref={cardRef} className="hs-card" style={{ width: `min(96vw, calc(56svh * ${aspect}))`, aspectRatio: String(aspect) }}>
            <canvas ref={canvasRef} aria-hidden className="hs-canvas" />
            <div aria-hidden className="hs-card-shade" />
          </div>
          <h2 ref={bottomRef} aria-hidden className="hs-title">{titleBottom}</h2>
        </div>
        {scrollHint && <div ref={hintRef} className="hs-hint">{scrollHint}<span /></div>}
      </div>
    </section>
  )
}
