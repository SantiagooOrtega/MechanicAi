import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type CSSProperties, useMemo, useRef } from 'react';
import { observeWindowResize, waitForScrollerReady } from './scroll-gallery-utils/scroll-trigger-utils';

gsap.registerPlugin(ScrollTrigger);

/**
 * Galería con scroll: cada tramo de scroll revela otra imagen con un barrido por franjas,
 * mientras el título y la descripción cambian. Adaptada de ScrollGallery (21st.dev) a CSS
 * propio (sin Tailwind) y a un contenedor con scroll (pista sticky, sin pin de GSAP).
 */

const MASK_HIDDEN = 'linear-gradient(to bottom, transparent 0%, transparent 100%)';
const MASK_REVEALED = 'linear-gradient(to bottom, black 0%, black 100%)';

export interface ScrollGallerySlide {
  image: string;
  title: string;
  description?: string;
  eyebrow?: string;
}

export interface ScrollGalleryProps {
  slides: ScrollGallerySlide[];
  /** Contenedor con scroll (por defecto, la ventana) */
  scroller?: HTMLElement | null;
  /** Scroll (en vh) por cada transición */
  scrollPerTransition?: number;
  /** Scroll (en vh) antes de la primera y después de la última transición */
  edgeDelay?: number;
  stripsCount?: number;
  scaleFrom?: number;
  scrub?: number;
  className?: string;
}

function createStripBounds(stripsCount: number) {
  return Array.from({ length: stripsCount }, (_, j) => {
    const step = 100 / stripsCount;
    const posFromBottom = stripsCount - j - 1;
    return { lower: (posFromBottom + 1) * step, upperGap: posFromBottom * step - 0.1, delay: (j / stripsCount) * 0.5 };
  });
}

function buildStripMask(bounds: ReturnType<typeof createStripBounds>, progress: number, speed: number) {
  const intervals: { top: number; bottom: number }[] = [];
  for (const b of bounds) {
    const adj = Math.max(0, Math.min(1, (progress - b.delay) * speed));
    if (adj > 0) intervals.push({ top: b.lower - adj * (b.lower - b.upperGap), bottom: b.lower });
  }
  if (!intervals.length) return MASK_HIDDEN;
  intervals.sort((a, b) => a.top - b.top);
  const merged = [{ ...intervals[0] }];
  for (const next of intervals.slice(1)) {
    const last = merged[merged.length - 1];
    if (next.top <= last.bottom) last.bottom = Math.max(last.bottom, next.bottom);
    else merged.push({ ...next });
  }
  const stops: string[] = [];
  let cursor = 0;
  for (const { top, bottom } of merged) {
    if (top > cursor) stops.push(`transparent ${cursor}%`, `transparent ${top}%`);
    stops.push(`black ${top}%`, `black ${bottom}%`);
    cursor = bottom;
  }
  if (cursor < 100) stops.push(`transparent ${cursor}%`, 'transparent 100%');
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

function setMask(el: HTMLElement, value: string) {
  el.style.maskImage = value;
  el.style.webkitMaskImage = value;
}

export function ScrollGallery({
  slides,
  scroller,
  scrollPerTransition = 120,
  edgeDelay = 40,
  stripsCount = 20,
  scaleFrom = 1.2,
  scrub = 1,
  className,
}: ScrollGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const transitions = Math.max(0, slides.length - 1);
  const totalVh = transitions * scrollPerTransition + edgeDelay * 2 + 100;
  const pad = (n: number) => String(n).padStart(2, '0');
  const total = useMemo(() => pad(slides.length), [slides.length]);

  useGSAP(
    () => {
      const track = trackRef.current;
      const stack = imagesRef.current;
      const titleEl = titleRef.current;
      if (!track || !stack || !titleEl || slides.length === 0) return;

      let disposed = false;
      let trigger: ScrollTrigger | null = null;
      let unbind: (() => void) | undefined;
      let ro: ResizeObserver | undefined;

      const layers = Array.from(stack.querySelectorAll<HTMLImageElement>('img'));
      const bounds = createStripBounds(stripsCount);
      const scaleTo = 1;
      const scaleStep = (scaleFrom - scaleTo) / 2;
      const scrollSpan = transitions * scrollPerTransition + edgeDelay * 2;
      const ranges = Array.from({ length: transitions }, (_, i) => ({
        start: (edgeDelay + i * scrollPerTransition) / scrollSpan,
        end: (edgeDelay + (i + 1) * scrollPerTransition) / scrollSpan,
      }));

      const imageProgress = (p: number) => {
        if (!ranges.length || p < ranges[0].start) return 0;
        for (let i = 0; i < ranges.length; i++) {
          if (p <= ranges[i].end) return i + Math.max(0, (p - ranges[i].start) / (ranges[i].end - ranges[i].start));
        }
        return ranges.length;
      };
      const scaleFor = (index: number, continuous: number) => {
        const diff = continuous - index + 1; // la capa i aparece en la transición i-1
        if (diff <= 0) return scaleFrom;
        if (diff >= 2) return scaleTo;
        return scaleFrom - scaleStep * diff;
      };

      // Cambio de título: cada apartado tiene su bloque; se muestra uno a la vez
      const blocks = Array.from(titleEl.children) as HTMLElement[];
      let current = 0;
      gsap.set(blocks, { yPercent: 110, opacity: 0 });
      gsap.set(blocks[0], { yPercent: 0, opacity: 1 });
      const showTitle = (index: number, down: boolean) => {
        if (index === current) return;
        const prev = blocks[current];
        const next = blocks[index];
        gsap.killTweensOf([prev, next]);
        gsap.to(prev, { yPercent: down ? -110 : 110, opacity: 0, duration: 0.45, ease: 'power3.in' });
        gsap.fromTo(next, { yPercent: down ? 110 : -110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.18 });
        blocks.forEach((b, i) => { if (i !== index && i !== current) gsap.set(b, { yPercent: 110, opacity: 0 }); });
        current = index;
        if (counterRef.current) counterRef.current.textContent = pad(index + 1);
      };

      let last = 0;
      const update = (p: number) => {
        const ip = imageProgress(p);
        const idx = Math.floor(ip);
        const local = ip - idx;
        const titleIdx = local >= 0.35 ? Math.min(idx + 1, slides.length - 1) : idx;
        showTitle(titleIdx, ip >= last);
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        layers.forEach((img, i) => {
          img.style.transform = `translate3d(0,0,0) scale(${scaleFor(i, ip)})`;
          if (i === 0) return;
          if (i - 1 < idx) setMask(img, MASK_REVEALED);
          else if (i - 1 === idx) setMask(img, buildStripMask(bounds, local, 2));
          else setMask(img, MASK_HIDDEN);
        });
        last = ip;
      };

      const mount = async () => {
        const target = scroller ?? window;
        await waitForScrollerReady(target);
        if (disposed) return;
        trigger = ScrollTrigger.create({
          trigger: track,
          scroller: target,
          start: 'top top',
          end: 'bottom bottom',
          scrub,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
        });
        if (scroller) {
          ro = new ResizeObserver(() => ScrollTrigger.refresh());
          ro.observe(scroller);
        } else {
          unbind = observeWindowResize(() => ScrollTrigger.refresh());
        }
        update(trigger.progress);
      };
      mount().catch(() => { /* desmontado antes de tiempo */ });

      return () => {
        disposed = true;
        ro?.disconnect();
        unbind?.();
        trigger?.kill();
      };
    },
    { scope: trackRef, dependencies: [slides, scroller, scrollPerTransition, edgeDelay, stripsCount, scaleFrom, scrub] },
  );

  return (
    <div ref={trackRef} className={`sg-track${className ? ` ${className}` : ''}`} style={{ height: `${totalVh}vh` } as CSSProperties}>
      <section className="sg">
        <div className="sg-images" ref={imagesRef}>
          {slides.map((s, i) => (
            <div key={s.image} className="sg-frame">
              <img src={s.image} alt={s.title} decoding="async" draggable={false}
                style={{ transform: `scale(${scaleFrom})`, ...(i > 0 && { maskImage: MASK_HIDDEN, WebkitMaskImage: MASK_HIDDEN }) }} />
            </div>
          ))}
        </div>
        <div className="sg-shade" aria-hidden />
        <div className="sg-info">
          <div className="sg-counter"><span ref={counterRef}>01</span><i>/ {total}</i></div>
          <div className="sg-titles" ref={titleRef}>
            {slides.map((s) => (
              <div key={s.title} className="sg-block">
                {s.eyebrow && <p className="sg-eyebrow">{s.eyebrow}</p>}
                <h2>{s.title}</h2>
                {s.description && <p className="sg-desc">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="sg-progress" aria-hidden><span ref={barRef} /></div>
      </section>
    </div>
  );
}

export default ScrollGallery;
