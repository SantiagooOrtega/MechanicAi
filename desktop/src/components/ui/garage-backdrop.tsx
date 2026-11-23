import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { buildStripMask, createStripBounds } from './scroll-gallery';

/**
 * Fondo de taller de cada sección (fotos 4K en public/garage). Al cambiar de sección la foto
 * nueva entra con el mismo barrido por franjas de la galería de la portada, y al hacer scroll
 * la foto se aleja un poco (de 1.12 a 1) como en la galería.
 */

const img = (f: string) => `${import.meta.env.BASE_URL}garage/${f}`;

export function backdropFor(pathname: string) {
  if (pathname.startsWith('/diagnosis/new')) return img('1-diagnostico.jpg');
  if (pathname.startsWith('/diagnoses')) return img('2-obd.jpg');
  if (pathname.startsWith('/vehicles')) return img('3-vehiculos.jpg');
  if (pathname.startsWith('/maintenance')) return img('4-mantenimiento.jpg');
  return img('5-taller.jpg');
}

const SCALE_FROM = 1.12;
const SCROLL_RANGE = 1400; // px de scroll para llegar a escala 1
const BOUNDS = createStripBounds(20);

type Layer = { id: number; src: string };

export function GarageBackdrop({ pathname, scroller }: { pathname: string; scroller: HTMLElement | null }) {
  const src = backdropFor(pathname);
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: 0, src }]);
  const rootRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // Nueva sección: se apila la foto y se revela por franjas
  useEffect(() => {
    setLayers((prev) => (prev[prev.length - 1].src === src ? prev : [...prev.slice(-1), { id: ++idRef.current, src }]));
  }, [src]);

  // useLayoutEffect: la máscara se aplica antes de pintar, sin parpadeo de la foto nueva
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (layers.length < 2 || !root) return;
    const top = root.querySelector<HTMLImageElement>(`[data-layer="${layers[layers.length - 1].id}"]`);
    if (!top) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { p: reduced ? 1 : 0 };
    const paint = () => {
      const m = state.p >= 1 ? 'none' : buildStripMask(BOUNDS, state.p, 2);
      top.style.maskImage = m;
      top.style.webkitMaskImage = m;
    };
    paint();
    const done = () => setLayers((prev) => prev.slice(-1));
    if (reduced) { done(); return; }
    const tween = gsap.to(state, { p: 1, duration: 1.1, ease: 'power2.inOut', onUpdate: paint, onComplete: done });
    return () => { tween.kill(); };
  }, [layers]);

  // Scroll: la foto se aleja suavemente
  useEffect(() => {
    const root = rootRef.current;
    if (!scroller || !root) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const t = Math.min(1, scroller.scrollTop / SCROLL_RANGE);
      root.style.setProperty('--gb-scale', String(SCALE_FROM - (SCALE_FROM - 1) * t));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => { scroller.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [scroller, pathname]);

  return (
    <div ref={rootRef} className="gb" aria-hidden>
      {layers.map((l) => (
        <img key={l.id} data-layer={l.id} src={l.src} alt="" decoding="async" draggable={false} />
      ))}
      <div className="gb-shade" />
    </div>
  );
}
